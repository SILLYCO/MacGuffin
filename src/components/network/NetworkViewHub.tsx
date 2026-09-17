"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Network,
  Server,
  Layers,
  Table,
  Plus,
  Cable,
  Plug,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { NetworkTopologyView } from "./NetworkTopologyView";
import { SwitchPortMatrix } from "./SwitchPortMatrix";
import { NetworkDeviceTable } from "./NetworkDeviceTable";
import { CablingListTable } from "./CablingListTable";
import { NetworkDeviceModal } from "./NetworkDeviceModal";

interface NetworkViewHubProps {
  initialNetworkDevices: any[];
  inventoryDevices: any[];
  printers: any[];
  userRole: string;
}

export function NetworkViewHub({
  initialNetworkDevices,
  inventoryDevices,
  printers,
  userRole,
}: NetworkViewHubProps) {
  const router = useRouter();
  const isIT = userRole === "IT";

  const [activeTab, setActiveTab] = useState<"TOPOLOGY" | "SWITCH_PORTS" | "DEVICES" | "CABLING">("TOPOLOGY");
  const [selectedSwitchId, setSelectedSwitchId] = useState<string>(
    initialNetworkDevices[0]?.id || ""
  );
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);

  const refreshData = () => {
    router.refresh();
  };

  // Metrics
  const totalSwitches = initialNetworkDevices.length;
  let totalPortsCapacity = 0;
  let totalPatchedCables = 0;

  initialNetworkDevices.forEach((dev) => {
    totalPortsCapacity += dev.totalPorts;
    totalPatchedCables += dev.outgoingConnections?.length || 0;
  });

  const freePorts = totalPortsCapacity - totalPatchedCables;
  const overallUtilization = totalPortsCapacity > 0 ? Math.round((totalPatchedCables / totalPortsCapacity) * 100) : 0;

  const currentSelectedSwitch = initialNetworkDevices.find((d) => d.id === selectedSwitchId) || initialNetworkDevices[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-primary/20 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary shadow-lg shadow-primary/25">
                <Network className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <span>Network Infrastructure & Topology</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Map office routers, core/access switches, port allocations, and physical Ethernet cable runs connected to workstations and printers.
            </p>
          </div>

          {isIT && (
            <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
              <button
                onClick={() => setIsAddDeviceModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Register Switch / Router</span>
              </button>
            </div>
          )}
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Network Devices
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5 block">
              {totalSwitches}
            </span>
            <span className="text-[10px] text-primary font-medium">Routers & Switches</span>
          </div>

          <div className="p-3 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Patched Cables
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-0.5 block">
              {totalPatchedCables}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Active Port Runs</span>
          </div>

          <div className="p-3 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Available Ports
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-cyan-400 mt-0.5 block">
              {freePorts}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Free for Expansion</span>
          </div>

          <div className="p-3 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Fleet Utilization
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-indigo-400 mt-0.5 block">
              {overallUtilization}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {totalPortsCapacity} Total Ports
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Segmented Tab Bar */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 max-w-full scrollbar-thin">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/40 border border-border/80 shrink-0">
          <button
            onClick={() => setActiveTab("TOPOLOGY")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "TOPOLOGY"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Interactive Topology Map</span>
          </button>

          <button
            onClick={() => setActiveTab("SWITCH_PORTS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "SWITCH_PORTS"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Switch Faceplates & Ports</span>
          </button>

          <button
            onClick={() => setActiveTab("DEVICES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "DEVICES"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Hardware Devices</span>
          </button>

          <button
            onClick={() => setActiveTab("CABLING")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "CABLING"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Cable className="w-3.5 h-3.5" />
            <span>All Cable Runs</span>
          </button>
        </div>

        {/* Quick Switch Selector (visible in Switch Ports Tab) */}
        {activeTab === "SWITCH_PORTS" && initialNetworkDevices.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
              Selected Switch:
            </span>
            <select
              value={selectedSwitchId}
              onChange={(e) => setSelectedSwitchId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-background border border-border/80 rounded-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {initialNetworkDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.brand} {d.model})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab Views */}
      {activeTab === "TOPOLOGY" && (
        <NetworkTopologyView
          networkDevices={initialNetworkDevices}
          inventoryDevices={inventoryDevices}
          printers={printers}
          isIT={isIT}
          onOpenDeviceModal={() => setIsAddDeviceModalOpen(true)}
        />
      )}

      {activeTab === "SWITCH_PORTS" && (
        <div className="space-y-6">
          {initialNetworkDevices.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-border/80">
              <Server className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">No Switches Registered Yet</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Register a switch or router to view its physical RJ45 faceplate.
              </p>
              {isIT && (
                <button
                  onClick={() => setIsAddDeviceModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl"
                >
                  + Register Switch
                </button>
              )}
            </div>
          ) : currentSelectedSwitch ? (
            <SwitchPortMatrix
              key={currentSelectedSwitch.id}
              device={currentSelectedSwitch}
              allNetworkDevices={initialNetworkDevices}
              inventoryDevices={inventoryDevices}
              printers={printers}
              onRefresh={refreshData}
              onSelectDevice={setSelectedSwitchId}
              isIT={isIT}
            />
          ) : null}
        </div>
      )}

      {activeTab === "DEVICES" && (
        <NetworkDeviceTable
          devices={initialNetworkDevices}
          isIT={isIT}
          onSelectDeviceForMatrix={(devId) => {
            setSelectedSwitchId(devId);
            setActiveTab("SWITCH_PORTS");
          }}
          onRefresh={refreshData}
        />
      )}

      {activeTab === "CABLING" && (
        <CablingListTable
          devices={initialNetworkDevices}
          isIT={isIT}
          onRefresh={refreshData}
        />
      )}

      {/* Add Device Modal */}
      {isAddDeviceModalOpen && (
        <NetworkDeviceModal
          onClose={() => setIsAddDeviceModalOpen(false)}
          onSuccess={() => {
            setIsAddDeviceModalOpen(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
