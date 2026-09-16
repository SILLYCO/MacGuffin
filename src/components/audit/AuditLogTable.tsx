"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  ShieldCheck,
  Laptop,
  Users,
  User,
  PlusCircle,
  Edit,
  RefreshCw,
  UserCheck,
  UserX,
  Trash2,
  Calendar,
  Eye,
  X,
  ScrollText,
} from "lucide-react";
import { AuditAction, AuditEntityType, Role } from "@prisma/client";
import { RoleBadge } from "@/components/ui/RoleBadge";

export interface AuditLogItem {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityName?: string | null;
  actorEmail: string;
  actorRole: Role;
  details?: string | null;
  createdAt: Date | string;
}

interface AuditLogTableProps {
  logs: AuditLogItem[];
  userRole: string;
}

export function AuditLogTable({ logs, userRole }: AuditLogTableProps) {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("ALL");
  const [actionCategory, setActionCategory] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (log.entityName && log.entityName.toLowerCase().includes(searchLower)) ||
      log.actorEmail.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      (log.details && log.details.toLowerCase().includes(searchLower));

    const matchesEntity = entityFilter === "ALL" || log.entityType === entityFilter;

    let matchesCategory = true;
    if (actionCategory !== "ALL") {
      if (actionCategory === "CREATE") {
        matchesCategory = log.action.endsWith("_CREATED");
      } else if (actionCategory === "UPDATE") {
        matchesCategory = log.action.endsWith("_UPDATED");
      } else if (actionCategory === "STATUS") {
        matchesCategory = log.action.includes("STATUS");
      } else if (actionCategory === "ASSIGNMENT") {
        matchesCategory = log.action.includes("ASSIGN");
      } else if (actionCategory === "DELETE") {
        matchesCategory = log.action.endsWith("_DELETED");
      }
    }

    let matchesDate = true;
    if (dateFilter !== "ALL") {
      const logDate = new Date(log.createdAt).getTime();
      const now = Date.now();
      if (dateFilter === "24H") {
        matchesDate = now - logDate <= 24 * 60 * 60 * 1000;
      } else if (dateFilter === "7D") {
        matchesDate = now - logDate <= 7 * 24 * 60 * 60 * 1000;
      } else if (dateFilter === "30D") {
        matchesDate = now - logDate <= 30 * 24 * 60 * 60 * 1000;
      }
    }

    return matchesSearch && matchesEntity && matchesCategory && matchesDate;
  });

  // CSV Export
  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      alert("No audit logs to export.");
      return;
    }

    const headers = ["Timestamp", "Action", "Entity Type", "Entity Name", "Actor Email", "Actor Role", "Details"];
    const rows = filteredLogs.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.action,
      l.entityType,
      `"${(l.entityName || "").replace(/"/g, '""')}"`,
      l.actorEmail,
      l.actorRole,
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-logs-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case "DEVICE_CREATED":
      case "EMPLOYEE_CREATED":
      case "USER_CREATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PlusCircle className="w-3.5 h-3.5" />
            {action.replace("_", " ")}
          </span>
        );
      case "DEVICE_UPDATED":
      case "EMPLOYEE_UPDATED":
      case "USER_ROLE_UPDATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Edit className="w-3.5 h-3.5" />
            {action.replace("_", " ")}
          </span>
        );
      case "DEVICE_STATUS_CHANGED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-3.5 h-3.5" />
            STATUS CHANGED
          </span>
        );
      case "DEVICE_ASSIGNED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <UserCheck className="w-3.5 h-3.5" />
            ASSIGNED
          </span>
        );
      case "DEVICE_UNASSIGNED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <UserX className="w-3.5 h-3.5" />
            UNASSIGNED
          </span>
        );
      case "DEVICE_DELETED":
      case "EMPLOYEE_DELETED":
      case "USER_DELETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Trash2 className="w-3.5 h-3.5" />
            {action.replace("_", " ")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-muted text-muted-foreground border border-border">
            {action}
          </span>
        );
    }
  };

  const getEntityIcon = (type: AuditEntityType) => {
    switch (type) {
      case "DEVICE":
        return <Laptop className="w-4 h-4 text-blue-400" />;
      case "EMPLOYEE":
        return <Users className="w-4 h-4 text-emerald-400" />;
      case "USER":
        return <User className="w-4 h-4 text-purple-400" />;
      case "ASSIGNMENT":
        return <UserCheck className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-8">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <ScrollText className="w-3.5 h-3.5" />
            Security & Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">System Audit Log</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Immutable, chronological audit trail of all hardware modifications, staff allocations, and user accounts
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-muted/80 text-foreground font-bold text-xs shadow-sm transition-all self-start sm:self-auto shrink-0"
        >
          <Download className="w-4 h-4 text-primary" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 sm:gap-4">
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by actor, entity name, action, or metadata..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Filters:
            </div>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Entity Types</option>
              <option value="DEVICE">Devices (Laptops)</option>
              <option value="EMPLOYEE">Employees</option>
              <option value="ASSIGNMENT">Assignments</option>
              <option value="USER">User Accounts</option>
            </select>

            <select
              value={actionCategory}
              onChange={(e) => setActionCategory(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Action Types</option>
              <option value="CREATE">Creations</option>
              <option value="UPDATE">Updates</option>
              <option value="STATUS">Status Changes</option>
              <option value="ASSIGNMENT">Assignments / Unassignments</option>
              <option value="DELETE">Deletions</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Time</option>
              <option value="24H">Last 24 Hours</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border/80 text-[11px] uppercase font-extrabold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target Entity</th>
                <th className="px-6 py-4">Actor (Performed By)</th>
                <th className="px-6 py-4">Details Summary</th>
                <th className="px-6 py-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-base text-foreground">No audit log records found</p>
                    <p className="text-xs text-muted-foreground mt-1">Actions performed across devices, employees, and users will appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let parsedDetails: Record<string, any> | null = null;
                  try {
                    if (log.details) parsedDetails = JSON.parse(log.details);
                  } catch (e) {
                    parsedDetails = null;
                  }

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {new Date(log.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(log.createdAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-muted/60 border border-border/80 shrink-0">
                            {getEntityIcon(log.entityType)}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-xs leading-tight">
                              {log.entityName || "N/A"}
                            </div>
                            <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">
                              {log.entityType}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-foreground leading-tight">
                          {log.actorEmail}
                        </div>
                        <RoleBadge role={log.actorRole} className="mt-1 text-[10px] py-0 px-2" />
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                        {parsedDetails ? (
                          <span className="font-mono text-[11px] bg-muted/40 px-2 py-0.5 rounded border border-border/60">
                            {Object.entries(parsedDetails)
                              .slice(0, 2)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}
                          </span>
                        ) : (
                          <span className="italic">No extra metadata</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-all border border-primary/20"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
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
            Showing <strong className="text-foreground">{filteredLogs.length}</strong> of <strong className="text-foreground">{logs.length}</strong> logged events
          </span>
        </div>
      </div>

      {/* Detail Modal / Inspector Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden space-y-4">
            <div className="p-5 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground font-bold text-base">
                <ScrollText className="w-5 h-5 text-primary" />
                <span>Audit Log Inspector</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/30 border border-border/60">
                <div>
                  <span className="block text-[10px] font-extrabold uppercase text-muted-foreground">
                    Action Performed
                  </span>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>

                <div>
                  <span className="block text-[10px] font-extrabold uppercase text-muted-foreground">
                    Timestamp
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-extrabold uppercase text-muted-foreground">
                    Target Entity
                  </span>
                  <span className="font-semibold text-foreground text-xs">
                    {selectedLog.entityName || selectedLog.entityId || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-extrabold uppercase text-muted-foreground">
                    Actor
                  </span>
                  <span className="font-semibold text-foreground text-xs block truncate" title={selectedLog.actorEmail}>
                    {selectedLog.actorEmail}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
                  Action Metadata & Diffs (JSON)
                </span>
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 text-xs font-mono overflow-x-auto">
                  {selectedLog.details
                    ? JSON.stringify(JSON.parse(selectedLog.details), null, 2)
                    : "No additional metadata recorded."}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-border/80 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-bold text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
