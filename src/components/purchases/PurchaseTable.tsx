"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Package,
  Sparkles,
  ChevronRight,
  Eye,
  Trash2,
  X,
  Store,
  Tag,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { PurchaseCategory } from "@prisma/client";
import {
  PURCHASE_CATEGORY_DEFINITIONS,
  formatEGP,
} from "@/lib/constants";
import { deletePurchaseAction } from "@/lib/actions/purchases";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";

interface PurchaseItemData {
  id: string;
  name: string;
  category: PurchaseCategory;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  isTracked: boolean;
  autoStocked: boolean;
}

interface PurchaseData {
  id: string;
  title?: string | null;
  vendor: string;
  invoiceNumber?: string | null;
  purchaseDate: string | Date;
  totalAmount: number;
  currency: string;
  notes?: string | null;
  purchasedBy: string;
  items: PurchaseItemData[];
  createdAt: string | Date;
}

interface PurchaseTableProps {
  purchases: PurchaseData[];
  userRole: string;
}

export function PurchaseTable({ purchases, userRole }: PurchaseTableProps) {
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("ALL");
  const [trackingFilter, setTrackingFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isIT = userRole === "IT";

  // Financial aggregates
  let totalSpend = 0;
  let trackedSpend = 0;
  let untrackedSpend = 0;
  let totalItemsCount = 0;

  for (const p of purchases) {
    totalSpend += p.totalAmount;
    for (const item of p.items) {
      totalItemsCount += item.quantity;
      if (item.isTracked) {
        trackedSpend += item.totalPrice;
      } else {
        untrackedSpend += item.totalPrice;
      }
    }
  }

  // Unique vendors for filter
  const uniqueVendors = Array.from(new Set(purchases.map((p) => p.vendor))).sort();

  // Filtered purchases
  const filteredPurchases = purchases.filter((p) => {
    const searchLower = search.toLowerCase();
    const vendorMatches = p.vendor.toLowerCase().includes(searchLower);
    const invoiceMatches = p.invoiceNumber?.toLowerCase().includes(searchLower) ?? false;
    const titleMatches = p.title?.toLowerCase().includes(searchLower) ?? false;
    const itemsMatch = p.items.some((item) =>
      item.name.toLowerCase().includes(searchLower)
    );

    const matchesSearch = vendorMatches || invoiceMatches || titleMatches || itemsMatch;
    const matchesVendor = vendorFilter === "ALL" || p.vendor === vendorFilter;

    let matchesTracking = true;
    if (trackingFilter === "TRACKED_ONLY") {
      matchesTracking = p.items.some((item) => item.isTracked);
    } else if (trackingFilter === "UNTRACKED_ONLY") {
      matchesTracking = p.items.some((item) => !item.isTracked);
    }

    return matchesSearch && matchesVendor && matchesTracking;
  });

  const handleDelete = async (id: string, vendor: string, amount: number) => {
    if (
      !confirm(
        `Are you sure you want to delete purchase from "${vendor}" (${formatEGP(amount)})? This will remove the receipt record.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    await deletePurchaseAction(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <span>IT Purchases & Invoices</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              EGP (ج.م)
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log procurement receipts, monitor hardware asset pricing, and manage expense proofs
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ExportExcelButton scope="purchases" label="Export (.xlsx)" />
          {isIT && (
            <Link
              href="/purchases/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log New Purchase</span>
            </Link>
          )}
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Spend */}
        <div className="glass-card p-4.5 space-y-2 border-primary/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Procurement Spend
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            {formatEGP(totalSpend)}
          </div>
          <div className="text-[11px] text-muted-foreground font-medium">
            Across {purchases.length} total purchase {purchases.length === 1 ? "receipt" : "receipts"}
          </div>
        </div>

        {/* Card 2: Tracked Hardware Spend */}
        <div className="glass-card p-4.5 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Tracked Hardware Assets
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            {formatEGP(trackedSpend)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Physical inventory & swappable parts
          </div>
        </div>

        {/* Card 3: Untracked Supplies Spend */}
        <div className="glass-card p-4.5 space-y-2 border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Untracked Consumables
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            {formatEGP(untrackedSpend)}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Proof-of-purchase only (stickers, paste, ties)
          </div>
        </div>

        {/* Card 4: Total Units Purchased */}
        <div className="glass-card p-4.5 space-y-2 border-blue-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Total Units Purchased
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            {totalItemsCount}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            Individual products & modules received
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 md:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by vendor, invoice #, or product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Filters:
            </div>

            {/* Vendor Filter */}
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Vendors ({uniqueVendors.length})</option>
              {uniqueVendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* Tracking Type Filter */}
            <select
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Items (Tracked & Untracked)</option>
              <option value="TRACKED_ONLY">Contains Tracked Assets</option>
              <option value="UNTRACKED_ONLY">Contains Untracked Supplies</option>
            </select>

            {(search || vendorFilter !== "ALL" || trackingFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setVendorFilter("ALL");
                  setTrackingFilter("ALL");
                }}
                className="text-xs text-primary hover:underline font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1050px]">
            <thead className="bg-muted/50 border-b border-border/80 text-[11px] uppercase font-extrabold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap min-w-[130px]">Purchase Date</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[200px]">Vendor & Invoice</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[340px]">Purchased Products Breakdown</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[140px]">Total Amount</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[160px]">Logged By</th>
                <th className="px-6 py-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-base text-foreground">No purchase records found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {purchases.length === 0
                        ? "Click '+ Log New Purchase' to record your first hardware or supplies invoice."
                        : "Try adjusting your search query or filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => {
                  const dateObj = new Date(purchase.purchaseDate);
                  const formattedDate = dateObj.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr
                      key={purchase.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* 1. Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* 2. Vendor & Invoice */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{purchase.vendor}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                            <span>Inv: {purchase.invoiceNumber || "N/A"}</span>
                            {purchase.title && (
                              <>
                                <span>•</span>
                                <span className="font-sans font-medium italic text-muted-foreground truncate max-w-[140px]">
                                  {purchase.title}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Items Breakdown */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-[420px]">
                          {purchase.items.slice(0, 3).map((item) => {
                            const catDef = PURCHASE_CATEGORY_DEFINITIONS[item.category] || PURCHASE_CATEGORY_DEFINITIONS.OTHER;
                            return (
                              <span
                                key={item.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                                  item.isTracked
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                                    : "bg-muted/70 text-muted-foreground border-border/80"
                                }`}
                                title={`${item.name} (${item.quantity}x @ ${item.unitPrice} EGP)`}
                              >
                                <span className="font-bold">{item.quantity}x</span>
                                <span className="truncate max-w-[110px]">{item.name}</span>
                                {item.isTracked ? (
                                  <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold">
                                    Asset
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1 rounded bg-muted text-muted-foreground font-medium">
                                    Proof
                                  </span>
                                )}
                              </span>
                            );
                          })}

                          {purchase.items.length > 3 && (
                            <span className="px-2 py-0.5 rounded-lg bg-muted text-muted-foreground text-xs font-bold border border-border/60">
                              +{purchase.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Total Amount in EGP */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-black text-foreground text-sm font-mono tracking-tight">
                          {formatEGP(purchase.totalAmount)}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-semibold">
                          {purchase.items.length} {purchase.items.length === 1 ? "line item" : "line items"}
                        </div>
                      </td>

                      {/* 5. Logged By */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-foreground truncate max-w-[160px]" title={purchase.purchasedBy}>
                          {purchase.purchasedBy}
                        </div>
                      </td>

                      {/* 6. Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                          <Link
                            href={`/purchases/${purchase.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-all border border-primary/20 shrink-0"
                            title="View full invoice receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                            <ChevronRight className="w-3 h-3 ml-0.5 opacity-70" />
                          </Link>

                          {isIT && (
                            <button
                              type="button"
                              disabled={deletingId === purchase.id}
                              onClick={() => handleDelete(purchase.id, purchase.vendor, purchase.totalAmount)}
                              className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 shrink-0"
                              title="Delete purchase record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 border-t border-border/60 bg-muted/20 text-xs font-semibold text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{filteredPurchases.length}</strong> of{" "}
            <strong className="text-foreground">{purchases.length}</strong> purchase records
          </span>
          <span className="font-mono">
            Filtered Total: <strong className="text-foreground">{formatEGP(filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0))}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
