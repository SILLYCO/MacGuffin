"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Filter,
  Laptop,
  Monitor,
  Server,
  Eye,
  ChevronRight,
  Cpu,
  HardDrive,
  Layers,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DEVICE_STATUS_LABELS, BRAND_OPTIONS, DEVICE_TYPES } from "@/lib/constants";
import { DeviceType } from "@prisma/client";
import { computeDeviceLiveSpecs } from "@/lib/hardware";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";

interface DeviceItem {
  id: string;
  deviceType?: DeviceType;
  brand: string;
  model: string;
  cpu: string;
  ram?: string | null;
  storage?: string | null;
  serialNumber: string;
  status: string;
  componentsCount?: number;
  components?: Array<{
    id?: string;
    type: string;
    brand: string;
    model: string;
    capacity?: string | null;
    specs?: string | null;
  }>;
  currentAssignment?: {
    employee: {
      id: string;
      name: string;
      email: string;
      department: string;
    };
  } | null;
}

interface DeviceTableProps {
  devices: DeviceItem[];
  userRole: string;
}

export function DeviceTable({ devices, userRole }: DeviceTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [brandFilter, setBrandFilter] = useState<string>("ALL");

  const isIT = userRole === "IT";

  const laptopCount = devices.filter((d) => !d.deviceType || d.deviceType === DeviceType.LAPTOP).length;
  const desktopCount = devices.filter((d) => d.deviceType === DeviceType.DESKTOP_PC).length;
  const workstationCount = devices.filter(
    (d) => d.deviceType === DeviceType.WORKSTATION || d.deviceType === DeviceType.SERVER
  ).length;

  const filteredDevices = devices.filter((device) => {
    const activeEmp = device.currentAssignment?.employee;
    const searchLower = search.toLowerCase();

    const matchesSearch =
      device.brand.toLowerCase().includes(searchLower) ||
      device.model.toLowerCase().includes(searchLower) ||
      device.serialNumber.toLowerCase().includes(searchLower) ||
      device.cpu.toLowerCase().includes(searchLower) ||
      (activeEmp && activeEmp.name.toLowerCase().includes(searchLower)) ||
      (activeEmp && activeEmp.email.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === "ALL" || device.status === statusFilter;
    const matchesBrand = brandFilter === "ALL" || device.brand === brandFilter;

    let matchesType = true;
    if (typeFilter === "LAPTOP") {
      matchesType = !device.deviceType || device.deviceType === DeviceType.LAPTOP;
    } else if (typeFilter === "DESKTOP_PC") {
      matchesType = device.deviceType === DeviceType.DESKTOP_PC;
    } else if (typeFilter === "WORKSTATION") {
      matchesType =
        device.deviceType === DeviceType.WORKSTATION || device.deviceType === DeviceType.SERVER;
    }

    return matchesSearch && matchesStatus && matchesBrand && matchesType;
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-8">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Company Computer Fleet
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track company laptops, desktop PCs, modular hardware components, and staff allocations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          <ExportExcelButton scope="devices" label="Export (.xlsx)" responsive={true} />
          {isIT && (
            <Link
              href="/devices/new"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Computer</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3.5 sm:p-4 md:p-5 space-y-3.5 sm:space-y-4">
        {/* Top Row: Search & Form-Factor Segmented Control */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
          <div className="relative w-full lg:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by brand, model, CPU, serial, or employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Form Factor Segmented Tabs */}
          <div className="overflow-x-auto max-w-full pb-1 sm:pb-0 -mx-1 px-1 flex">
            <div className="inline-flex p-1 bg-muted/60 border border-border/80 rounded-xl text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setTypeFilter("ALL")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all ${
                  typeFilter === "ALL"
                    ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({devices.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("LAPTOP")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                typeFilter === "LAPTOP"
                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              Laptops ({laptopCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("DESKTOP_PC")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                typeFilter === "DESKTOP_PC"
                  ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktops ({desktopCount})
            </button>
            {workstationCount > 0 && (
              <button
                type="button"
                onClick={() => setTypeFilter("WORKSTATION")}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  typeFilter === "WORKSTATION"
                    ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                Workstations ({workstationCount})
              </button>
            )}
            </div>
          </div>
        </div>

        {/* Secondary Row: Status & Brand Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Filters:
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-background/80 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Statuses</option>
              {Object.keys(DEVICE_STATUS_LABELS).map((status) => (
                <option key={status} value={status}>
                  {DEVICE_STATUS_LABELS[status].label}
                </option>
              ))}
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-background/80 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Brands</option>
              {BRAND_OPTIONS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {(search || typeFilter !== "ALL" || statusFilter !== "ALL" || brandFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTypeFilter("ALL");
                setStatusFilter("ALL");
                setBrandFilter("ALL");
              }}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Devices Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1020px]">
            <thead className="bg-muted/50 border-b border-border/80 text-[11px] uppercase font-extrabold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap min-w-[240px]">Computer & Model</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[260px]">Hardware Specs</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[150px]">Serial Number</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[120px]">Status</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[180px]">Assigned Employee</th>
                <th className="px-6 py-4 text-right whitespace-nowrap min-w-[130px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <Laptop className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-base text-foreground">No computers found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query or filter parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  const emp = device.currentAssignment?.employee;
                  const isDesktop = device.deviceType === DeviceType.DESKTOP_PC;
                  const isWorkstation = device.deviceType === DeviceType.WORKSTATION || device.deviceType === DeviceType.SERVER;
                  const liveSpecs = computeDeviceLiveSpecs(device);

                  return (
                    <tr
                      key={device.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform ${
                              isDesktop
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                : isWorkstation
                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {isDesktop ? (
                              <Monitor className="w-4.5 h-4.5" />
                            ) : isWorkstation ? (
                              <Server className="w-4.5 h-4.5" />
                            ) : (
                              <Laptop className="w-4.5 h-4.5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/devices/${device.id}`}
                                className="font-bold text-foreground group-hover:text-primary transition-colors text-sm hover:underline"
                              >
                                {device.brand} {device.model}
                              </Link>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                                  DEVICE_TYPES[device.deviceType || "LAPTOP"]?.badge ||
                                  "bg-muted text-muted-foreground"
                                }`}
                              >
                                {DEVICE_TYPES[device.deviceType || "LAPTOP"]?.shortLabel || "Laptop"}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                              Brand: {device.brand}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{device.cpu}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{liveSpecs.ramSummary}</span>
                            <span className="text-border">•</span>
                            <span>{liveSpecs.storageSummary}</span>
                          </div>
                          {liveSpecs.hasModularComponents ? (
                            <div className="pt-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                <Layers className="w-3 h-3 shrink-0" />
                                <span>{liveSpecs.totalModularPartsCount} modular {liveSpecs.totalModularPartsCount === 1 ? "part" : "parts"}</span>
                                {liveSpecs.gpuSummary ? <span>• {liveSpecs.gpuSummary}</span> : null}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/80 font-mono text-xs text-muted-foreground inline-block">
                          {device.serialNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={device.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {emp ? (
                          <Link
                            href={`/employees/${emp.id}`}
                            className="font-bold text-primary hover:underline block text-sm"
                          >
                            {emp.name}
                            <span className="block text-xs text-muted-foreground font-normal">
                              {emp.department}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground italic font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/devices/${device.id}`}
                          className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-all border border-primary/20"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                          <ChevronRight className="w-3 h-3 ml-0.5 opacity-70" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border/60 bg-muted/20 text-xs font-semibold text-muted-foreground flex justify-between items-center">
          <span>
            Showing <strong className="text-foreground">{filteredDevices.length}</strong> of{" "}
            <strong className="text-foreground">{devices.length}</strong> computers
          </span>
        </div>
      </div>
    </div>
  );
}
