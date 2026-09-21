"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  CheckCircle2,
  XCircle,
  Network,
  Cpu,
  Edit2,
  Activity,
  AlertTriangle,
  Server,
  Zap,
} from "lucide-react";
import { CameraChannelWithDevice, CctvOverviewData } from "@/lib/cctv/types";
import {
  updateCameraChannelAction,
  toggleChannelEnabledAction,
  testDvrConnectionAction,
} from "@/lib/actions/cctv";

interface CameraAdminTableProps {
  overviewData: CctvOverviewData;
}

export function CameraAdminTable({ overviewData }: CameraAdminTableProps) {
  const { device, channels, userRole } = overviewData;
  const isIT = userRole === "IT";

  const [testingDvr, setTestingDvr] = useState(false);
  const [testResult, setTestResult] = useState<{
    online: boolean;
    latencyMs?: number;
    message: string;
  } | null>(null);

  const [editingChannel, setEditingChannel] = useState<CameraChannelWithDevice | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    transcodeSub: false,
    enabled: true,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const runConnectivityTest = async () => {
    setTestingDvr(true);
    setTestResult(null);
    try {
      const res = await testDvrConnectionAction();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        online: false,
        message: err.message || "Failed to reach DVR",
      });
    } finally {
      setTestingDvr(false);
    }
  };

  const openEditModal = (ch: CameraChannelWithDevice) => {
    setEditingChannel(ch);
    setFormData({
      name: ch.name,
      location: ch.location || "",
      transcodeSub: ch.transcodeSub,
      enabled: ch.enabled,
      notes: ch.notes || "",
    });
    setActionError(null);
  };

  const handleToggleEnabled = async (ch: CameraChannelWithDevice) => {
    if (!isIT) return;
    try {
      await toggleChannelEnabledAction(ch.id, !ch.enabled);
    } catch (err: any) {
      alert(err.message || "Failed to update channel");
    }
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel || !isIT) return;

    setIsSubmitting(true);
    setActionError(null);

    const res = await updateCameraChannelAction({
      id: editingChannel.id,
      name: formData.name,
      location: formData.location,
      transcodeSub: formData.transcodeSub,
      enabled: formData.enabled,
      notes: formData.notes,
    });

    setIsSubmitting(false);

    if (res.error) {
      setActionError(res.error);
    } else {
      setEditingChannel(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* DVR Hardware & Network Link Summary Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-indigo-400">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {device?.name || "Office CCTV DVR"}
                </h3>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                  {device?.brand || "Advision (Dahua)"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Primary Surveillance Recording Server • {channels.length} Total Camera Channels
              </p>
            </div>
          </div>

          {/* Test Connectivity Action */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runConnectivityTest}
              disabled={testingDvr || !isIT}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-indigo-500 disabled:opacity-50"
            >
              <Activity className={`h-4 w-4 ${testingDvr ? "animate-spin" : ""}`} />
              <span>{testingDvr ? "Testing DVR Connection..." : "Test DVR Ping & Auth"}</span>
            </button>
          </div>
        </div>

        {/* Connectivity status banner */}
        {testResult && (
          <div
            className={`mt-4 flex items-center justify-between rounded-xl border p-3 text-xs ${
              testResult.online
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.online ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400" />
              )}
              <span className="font-semibold">{testResult.message}</span>
            </div>
            {testResult.latencyMs !== undefined && (
              <span className="font-mono text-[11px]">
                Latency: {testResult.latencyMs} ms
              </span>
            )}
          </div>
        )}

        {/* Device Parameters Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-[11px] font-medium text-slate-400">Host / IP Address</span>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-200">
              {device?.host || "192.168.1.114"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-[11px] font-medium text-slate-400">RTSP & HTTP Ports</span>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-200">
              RTSP: {device?.rtspPort || 554} • HTTP: {device?.httpPort || 80}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-[11px] font-medium text-slate-400">Physical Switch Link</span>
            {device?.networkDevice ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                <Network className="h-3.5 w-3.5" />
                <Link href="/network" className="underline hover:text-indigo-300">
                  {device.networkDevice.name}
                  {device.networkDevice.incomingConnections?.[0] &&
                    ` (Port ${device.networkDevice.incomingConnections[0].fromPort})`}
                </Link>
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">No physical patch recorded</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-[11px] font-medium text-slate-400">Streaming Protocol</span>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <Zap className="h-3.5 w-3.5" />
              <span>WebRTC Sub-Second Latency</span>
            </p>
          </div>
        </div>
      </div>

      {/* 16 Channels Settings Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur">
        <div className="border-b border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-400" />
              <h3 className="font-semibold text-white">Camera Channels Configuration</h3>
            </div>
            <span className="text-xs text-slate-400">
              {channels.filter((c) => c.enabled).length} of {channels.length} channels active
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Camera Name</th>
                <th className="px-4 py-3">Physical Location</th>
                <th className="px-4 py-3">Sub-Stream Mode</th>
                <th className="px-4 py-3">Status</th>
                {isIT && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {channels.map((ch) => (
                <tr key={ch.id} className="transition hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <span className="rounded bg-indigo-600/20 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-400 ring-1 ring-indigo-500/30">
                      CH {ch.channelNumber.toString().padStart(2, "0")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold">{ch.name}</td>
                  <td className="px-4 py-3 text-slate-400">{ch.location || "—"}</td>
                  <td className="px-4 py-3">
                    {ch.transcodeSub ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/20">
                        <Cpu className="h-3 w-3" /> Transcode (H.265)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                        Direct Passthrough (H.264)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={!isIT}
                      onClick={() => handleToggleEnabled(ch)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                        ch.enabled
                          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          ch.enabled ? "bg-emerald-400" : "bg-slate-500"
                        }`}
                      />
                      <span>{ch.enabled ? "Active" : "Disabled"}</span>
                    </button>
                  </td>
                  {isIT && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(ch)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 transition hover:bg-slate-700 hover:text-white"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Channel Modal */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Edit Channel {editingChannel.channelNumber}: {editingChannel.name}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Update camera labeling, physical location, and transcoding options.
            </p>

            {actionError && (
              <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSaveChannel} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Camera Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Ground Floor Reception"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional camera notes or lens angle info"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.transcodeSub}
                    onChange={(e) => setFormData({ ...formData, transcodeSub: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-200">
                      Enable Sub-Stream Transcode (FFmpeg)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Check if this channel outputs H.265 sub-stream instead of H.264
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-200">Channel Active</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
