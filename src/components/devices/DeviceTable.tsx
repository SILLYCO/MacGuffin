"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, Filter, Laptop, Eye, ChevronRight, Cpu, HardDrive } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DEVICE_STATUS_LABELS, BRAND_OPTIONS } from "@/lib/constants";

interface DeviceItem {
  id: string;
  brand: string;
  model: string;
  cpu: string;
  ram: string;
  storage: string;
  serialNumber: string;
  status: string;
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
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [brandFilter, setBrandFilter] = useState<string>("ALL");

  const isIT = userRole === "IT";

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

    return matchesSearch && matchesStatus && matchesBrand;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Company Laptop Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage hardware inventory, specs, serial numbers, and staff device allocations
          </p>
        </div>

        {isIT && (
          <Link
            href="/devices/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Device
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-5 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by brand, model, CPU, serial, or employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-primary" />
            Filters:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-sm bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
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
            className="px-3.5 py-2.5 text-sm bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
          >
            <option value="ALL">All Brands</option>
            {BRAND_OPTIONS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Devices Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border/80 text-[11px] uppercase font-extrabold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-6 py-4">Device Model</th>
                <th className="px-6 py-4">Hardware Specs (CPU / RAM / Storage)</th>
                <th className="px-6 py-4">Serial Number</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned Employee</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <Laptop className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-base text-foreground">No laptops found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query or filter parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  const emp = device.currentAssignment?.employee;
                  return (
                    <tr
                      key={device.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            <Laptop className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="font-bold text-foreground group-hover:text-primary transition-colors text-base">
                              {device.brand} {device.model}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                              Brand: {device.brand}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-primary" />
                            {device.cpu}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
                            {device.ram} • {device.storage}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/80 font-mono text-xs text-muted-foreground">
                          {device.serialNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={device.status} />
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/devices/${device.id}`}
                          className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-all border border-primary/20"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
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
            Showing <strong className="text-foreground">{filteredDevices.length}</strong> of <strong className="text-foreground">{devices.length}</strong> laptops
          </span>
        </div>
      </div>
    </div>
  );
}
