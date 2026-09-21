"use client";

import React, { useState } from "react";
import {
  Video,
  Film,
  Sliders,
  ShieldCheck,
  Server,
  Network,
  Zap,
} from "lucide-react";
import { CctvOverviewData } from "@/lib/cctv/types";
import { LiveCameraGrid } from "./LiveCameraGrid";
import { PlaybackTimelineView } from "./PlaybackTimelineView";
import { CameraAdminTable } from "./CameraAdminTable";

type CctvTab = "live" | "playback" | "settings";

interface CctvViewHubProps {
  overviewData: CctvOverviewData;
}

export function CctvViewHub({ overviewData }: CctvViewHubProps) {
  const [activeTab, setActiveTab] = useState<CctvTab>("live");
  const { device, channels, stats, userRole } = overviewData;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-indigo-950/20 to-slate-900/90 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                <Video className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                CCTV Surveillance & Security
              </h1>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                Live Gateway Ready
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Advision 16-Channel 1080N DVR ({device?.host || "192.168.1.114"}) • Low-latency WebRTC streams & 24h timeline playback
            </p>
          </div>

          {/* Quick stats pills */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300 shadow">
              <Server className="h-4 w-4 text-indigo-400" />
              <div>
                <span className="text-[10px] text-slate-500 block">Fleet Status</span>
                <span className="font-semibold text-slate-200">
                  {stats.activeChannels} / {stats.totalChannels} Online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300 shadow">
              <Zap className="h-4 w-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-500 block">Streaming</span>
                <span className="font-semibold text-emerald-400">WebRTC P2P</span>
              </div>
            </div>

            {device?.networkDevice && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300 shadow">
                <Network className="h-4 w-4 text-indigo-400" />
                <div>
                  <span className="text-[10px] text-slate-500 block">Switch Port</span>
                  <span className="font-semibold text-indigo-300">
                    {device.networkDevice.name}
                    {device.networkDevice.incomingConnections?.[0] &&
                      ` :P${device.networkDevice.incomingConnections[0].fromPort}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-800/80 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "live"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Live Camera Fleet</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 font-mono text-[10px]">
              {channels.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("playback")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "playback"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <Film className="h-4 w-4" />
            <span>24h Timeline Playback</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Hardware & Settings</span>
            {userRole === "IT" && (
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">
                IT
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Tab View Body */}
      <div>
        {activeTab === "live" && <LiveCameraGrid channels={channels} />}
        {activeTab === "playback" && <PlaybackTimelineView channels={channels} />}
        {activeTab === "settings" && <CameraAdminTable overviewData={overviewData} />}
      </div>
    </div>
  );
}
