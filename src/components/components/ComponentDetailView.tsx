"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Cpu,
  ArrowLeft,
  ArrowRightLeft,
  Trash2,
  Edit2,
  Plus,
  Laptop,
  UserCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  FileText,
  Copy,
  Check,
  HardDrive,
  ExternalLink,
  History,
  Tag,
  Store,
  ShieldCheck,
} from "lucide-react";
import { ComponentType, ComponentStatus, ComponentTransferAction } from "@prisma/client";
import {
  COMPONENT_TYPES,
  COMPONENT_STATUS_LABELS,
  DEVICE_TYPES,
  formatEGP,
} from "@/lib/constants";
import { deleteComponentAction } from "@/lib/actions/components";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { computeDeviceLiveSpecs } from "@/lib/hardware";
import { ComponentModal } from "./ComponentModal";
import { InstallComponentModal } from "./InstallComponentModal";
import { DetachOrTransferModal } from "./DetachOrTransferModal";

interface TransferRecord {
  id: string;
  fromDeviceName?: string | null;
  toDeviceName?: string | null;
  actionType: ComponentTransferAction;
  reason?: string | null;
  performedByEmail: string;
  transferredAt: Date | string;
}

interface DeviceOption {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  deviceType?: string;
}

interface ComponentDetailProps {
  component: {
    id: string;
    type: ComponentType;
    brand: string;
    model: string;
    capacity?: string | null;
    specs?: string | null;
    serialNumber: string;
    status: ComponentStatus;
    notes?: string | null;
    purchasePrice?: number | null;
    deviceId?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    device?: {
      id: string;
      brand: string;
      model: string;
      serialNumber: string;
      deviceType: string;
      cpu: string;
      ram: string;
      storage: string;
      status: string;
      components?: Array<{
        id: string;
        type: string;
        brand: string;
        model: string;
        capacity?: string | null;
        specs?: string | null;
      }>;
      assignments: Array<{
        assignedAt: Date | string;
        employee: {
          id: string;
          name: string;
          email: string;
          department: string;
        };
      }>;
    } | null;
    purchaseItem?: {
      id: string;
      name: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      purchase: {
        id: string;
        title?: string | null;
        vendor: string;
        invoiceNumber?: string | null;
        purchaseDate: Date | string;
      };
    } | null;
    transfers: TransferRecord[];
  };
  devices: DeviceOption[];
  userRole: string;
}

export function ComponentDetailView({ component, devices, userRole }: ComponentDetailProps) {
  const router = useRouter();
  const isIT = userRole === "IT";

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Copied serial state
  const [copied, setCopied] = useState(false);

  const handleCopySerial = () => {
    navigator.clipboard.writeText(component.serialNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    const confirmMessage = component.deviceId
      ? `This component is currently INSTALLED in ${component.device?.brand} ${component.device?.model}. Are you sure you want to permanently delete "${component.brand} ${component.model}" (${component.serialNumber})?`
      : `Are you sure you want to permanently delete "${component.brand} ${component.model}" (${component.serialNumber}) from inventory?`;

    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteComponentAction(component.id);
    if (res?.error) {
      setDeleteError(res.error);
      setIsDeleting(false);
    } else {
      router.push("/components");
      router.refresh();
    }
  };

  const typeMeta = COMPONENT_TYPES[component.type] || COMPONENT_TYPES.OTHER;
  const statusMeta = COMPONENT_STATUS_LABELS[component.status] || COMPONENT_STATUS_LABELS.IN_STOCK;
  const activeAssignment = component.device?.assignments?.[0];
  const activeEmployee = activeAssignment?.employee;

  const deviceTypeMeta = component.device
    ? (DEVICE_TYPES as Record<string, any>)[component.device.deviceType] || DEVICE_TYPES.LAPTOP
    : null;
  const hostLiveSpecs = component.device ? computeDeviceLiveSpecs(component.device) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/components"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Components & Parts Shelf</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">ID: {component.id}</span>
      </div>

      {/* Error Alert */}
      {deleteError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{deleteError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="text-xs font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="glass-card p-6 md:p-8 space-y-6 relative overflow-hidden border-border/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${typeMeta.badge}`}
              >
                {typeMeta.label}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusMeta.border} ${statusMeta.bg} ${statusMeta.text}`}
              >
                {statusMeta.label}
              </span>
              {component.capacity && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                  {component.capacity}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {component.brand} {component.model}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={handleCopySerial}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/60 border border-border/70 hover:bg-muted font-mono transition-colors text-foreground"
                title="Click to copy serial number"
              >
                <span>SN: {component.serialNumber}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span>•</span>
              <span>
                Added {new Date(component.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {isIT && (
              <>
                {component.status === ComponentStatus.IN_STOCK && (
                  <button
                    type="button"
                    onClick={() => setIsInstallModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Mount into PC</span>
                  </button>
                )}

                {component.status === ComponentStatus.INSTALLED && (
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all hover:scale-105"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Swap / Detach</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-bold text-sm hover:bg-muted transition-all shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Specs</span>
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive font-bold text-sm hover:bg-destructive hover:text-destructive-foreground transition-all disabled:opacity-50"
                  title="Permanently remove component from inventory"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? "Deleting..." : "Delete Part"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Assignment & Custody + Specs & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Where it's assigned & Hardware Specifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Current Placement & Custody ("Where it's assigned") */}
          <div className="glass-card p-6 space-y-5 border-border/80">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">
                    Current Placement & Custody
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Physical mounting location and employee custody breakdown
                  </p>
                </div>
              </div>
            </div>

            {component.status === ComponentStatus.INSTALLED && component.device ? (
              <div className="space-y-4">
                {/* Host Computer Card */}
                <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                        Host Computer
                      </span>
                      <Link
                        href={`/devices/${component.device.id}`}
                        className="text-lg font-black text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group mt-0.5"
                      >
                        <span>
                          {component.device.brand} {component.device.model}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          SN: {component.device.serialNumber}
                        </span>
                        {deviceTypeMeta && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${deviceTypeMeta.badge}`}
                          >
                            {deviceTypeMeta.label}
                          </span>
                        )}
                        <StatusBadge status={component.device.status as any} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs p-3 rounded-xl bg-muted/40 border border-border/50">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold block">CPU</span>
                      <strong className="text-foreground">{component.device.cpu || "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total RAM</span>
                      <strong className="text-foreground">
                        {hostLiveSpecs?.ramSummary && hostLiveSpecs.ramSummary !== "Modular / None"
                          ? hostLiveSpecs.ramSummary
                          : component.device.ram?.trim() || "Modular"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total Storage</span>
                      <strong className="text-foreground">
                        {hostLiveSpecs?.storageSummary && hostLiveSpecs.storageSummary !== "Modular / None"
                          ? hostLiveSpecs.storageSummary
                          : component.device.storage?.trim() || "Modular"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Employee Custody Banner */}
                {activeEmployee ? (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-card to-blue-500/5 border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        <UserCheck className="w-4 h-4" />
                        <span>In Physical Custody of Employee</span>
                      </div>
                      {activeAssignment?.assignedAt && (
                        <span className="text-[11px] text-muted-foreground">
                          Since {new Date(activeAssignment.assignedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div>
                        <Link
                          href={`/employees/${activeEmployee.id}`}
                          className="text-base font-extrabold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
                        >
                          <span>{activeEmployee.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{activeEmployee.email}</span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[10px]">
                            {activeEmployee.department}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/employees/${activeEmployee.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors shrink-0"
                      >
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>View Employee Profile</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      The host computer is currently <strong>unassigned</strong> in IT storage. This component will be transferred to an employee once the computer is deployed.
                    </span>
                  </div>
                )}
              </div>
            ) : component.status === ComponentStatus.IN_STOCK ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Available in IT Storage Closet
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                    This component is unmounted and sitting on the spare parts shelf. It is ready to be installed into any compatible workstation, laptop, or desktop PC.
                  </p>
                </div>
                {isIT && (
                  <button
                    type="button"
                    onClick={() => setIsInstallModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mount into Computer Now</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-muted/40 border border-border/70 text-center space-y-2">
                <StatusBadge status={component.status as any} />
                <p className="text-xs text-muted-foreground mt-2">
                  This component is currently not installed in any host computer.
                </p>
              </div>
            )}
          </div>

          {/* Card: Hardware Specifications */}
          <div className="glass-card p-6 space-y-5 border-border/80">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Hardware Specifications</h2>
                  <p className="text-xs text-muted-foreground">Detailed technical parameters and metadata</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Category / Type</span>
                <div className="font-extrabold text-foreground text-sm flex items-center gap-2">
                  <span>{typeMeta.label}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Manufacturer / Brand</span>
                <div className="font-extrabold text-foreground text-sm">{component.brand}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Model Name</span>
                <div className="font-extrabold text-foreground text-sm">{component.model}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Capacity</span>
                <div className="font-extrabold text-foreground text-sm">
                  {component.capacity || <span className="text-muted-foreground font-normal italic">Standard / N/A</span>}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Technical Specs</span>
                <div className="font-mono font-medium text-foreground text-xs">
                  {component.specs || <span className="text-muted-foreground italic font-sans">No technical specs recorded</span>}
                </div>
              </div>

              {component.notes && (
                <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Internal Notes</span>
                  <div className="text-muted-foreground text-xs leading-relaxed">{component.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Procurement & Full Transfer Timeline */}
        <div className="space-y-6">
          {/* Card: Procurement & Expense Link */}
          <div className="glass-card p-6 space-y-4 border-border/80">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Procurement & Pricing</h3>
                <p className="text-[11px] text-muted-foreground">Cost tracking in Egyptian Pounds</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Original Purchase Price
                </span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {component.purchasePrice ? formatEGP(component.purchasePrice) : "Not recorded"}
                </div>
              </div>

              {component.purchaseItem?.purchase ? (
                <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Linked Procurement Receipt
                  </span>
                  <div className="space-y-1">
                    <div className="font-extrabold text-foreground flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-primary" />
                      <span>{component.purchaseItem.purchase.vendor}</span>
                    </div>
                    {component.purchaseItem.purchase.invoiceNumber && (
                      <div className="text-[11px] font-mono text-muted-foreground">
                        Inv #{component.purchaseItem.purchase.invoiceNumber}
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground">
                      Purchased: {new Date(component.purchaseItem.purchase.purchaseDate).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </div>
                  </div>

                  <Link
                    href={`/purchases/${component.purchaseItem.purchase.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-1"
                  >
                    <span>View Full Invoice Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  Stocked as manual hardware inventory without an associated procurement receipt.
                </p>
              )}
            </div>
          </div>

          {/* Card: Chronological Transfer Trail */}
          <div className="glass-card p-6 space-y-4 border-border/80">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Transfer & Audit Trail</h3>
                <p className="text-[11px] text-muted-foreground">Chronological lifecycle history</p>
              </div>
            </div>

            {component.transfers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                No transfer logs recorded for this part yet.
              </p>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                {component.transfers.map((t) => {
                  let actionBadge = "bg-muted text-muted-foreground";
                  let actionLabel: string = t.actionType;

                  if (t.actionType === ComponentTransferAction.INSTALLED_FROM_STOCK) {
                    actionBadge = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
                    actionLabel = "Installed in PC";
                  } else if (t.actionType === ComponentTransferAction.DETACHED_TO_STOCK) {
                    actionBadge = "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20";
                    actionLabel = "Detached to Shelf";
                  } else if (t.actionType === ComponentTransferAction.TRANSFERRED_BETWEEN_DEVICES) {
                    actionBadge = "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20";
                    actionLabel = "Swapped to PC";
                  } else if (t.actionType === ComponentTransferAction.MARKED_DEFECTIVE) {
                    actionBadge = "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20";
                    actionLabel = "Marked Defective";
                  } else if (t.actionType === ComponentTransferAction.RETIRED) {
                    actionBadge = "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/20";
                    actionLabel = "Retired";
                  }

                  return (
                    <div key={t.id} className="relative pl-7 space-y-1 text-xs">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${actionBadge}`}>
                          {actionLabel}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {new Date(t.transferredAt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      {(t.fromDeviceName || t.toDeviceName) && (
                        <div className="font-semibold text-foreground text-[11px] pt-0.5">
                          {t.fromDeviceName || "Stock"} ➔ {t.toDeviceName || "Stock"}
                        </div>
                      )}

                      {t.reason && (
                        <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/40">
                          {t.reason}
                        </div>
                      )}

                      <div className="text-[10px] text-muted-foreground/70">
                        By: {t.performedByEmail}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Component Specs Modal */}
      {isEditModalOpen && (
        <ComponentModal
          initialComponent={{
            id: component.id,
            type: component.type,
            brand: component.brand,
            model: component.model,
            capacity: component.capacity,
            specs: component.specs,
            serialNumber: component.serialNumber,
            notes: component.notes,
            deviceId: component.deviceId,
          }}
          devices={devices}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Install Component Modal */}
      {isInstallModalOpen && (
        <InstallComponentModal
          componentId={component.id}
          componentTitle={`${component.brand} ${component.model}`}
          componentSerial={component.serialNumber}
          devices={devices}
          onClose={() => setIsInstallModalOpen(false)}
          onSuccess={() => {
            setIsInstallModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Detach / Transfer Component Modal */}
      {isTransferModalOpen && component.device && (
        <DetachOrTransferModal
          componentId={component.id}
          componentTitle={`${component.brand} ${component.model}`}
          componentSerial={component.serialNumber}
          currentDeviceName={`${component.device.brand} ${component.device.model}`}
          currentDeviceId={component.device.id}
          devices={devices}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
