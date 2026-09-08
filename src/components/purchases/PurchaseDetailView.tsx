"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Receipt,
  ArrowLeft,
  Printer,
  Edit2,
  Trash2,
  Store,
  Calendar,
  Package,
  FileText,
  Layers,
  CheckCircle2,
  User,
  Plus,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  PURCHASE_CATEGORY_DEFINITIONS,
  formatEGP,
} from "@/lib/constants";
import { deletePurchaseAction, stockPurchaseItemAction } from "@/lib/actions/purchases";

interface ComponentRecord {
  id: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: string;
  deviceId?: string | null;
  device?: {
    id: string;
    brand: string;
    model: string;
    serialNumber: string;
  } | null;
}

interface PurchaseItemDetail {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  isTracked: boolean;
  autoStocked: boolean;
  notes?: string | null;
  components: ComponentRecord[];
}

interface PurchaseDetailProps {
  purchase: {
    id: string;
    title?: string | null;
    vendor: string;
    invoiceNumber?: string | null;
    purchaseDate: string | Date;
    totalAmount: number;
    currency: string;
    notes?: string | null;
    purchasedBy: string;
    createdAt: string | Date;
    items: PurchaseItemDetail[];
  };
  userRole: string;
}

export function PurchaseDetailView({ purchase, userRole }: PurchaseDetailProps) {
  const router = useRouter();
  const isIT = userRole === "IT";

  const [stockingId, setStockingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateObj = new Date(purchase.purchaseDate);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate subtotals
  let trackedSubtotal = 0;
  let untrackedSubtotal = 0;
  let totalUnits = 0;

  for (const item of purchase.items) {
    totalUnits += item.quantity;
    if (item.isTracked) {
      trackedSubtotal += item.totalPrice;
    } else {
      untrackedSubtotal += item.totalPrice;
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete this purchase receipt from "${purchase.vendor}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    const res = await deletePurchaseAction(purchase.id);
    setDeleting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/purchases");
    }
  };

  const handleStockItem = async (itemId: string) => {
    setStockingId(itemId);
    setError(null);
    const res = await stockPurchaseItemAction(itemId);
    setStockingId(null);

    if (res?.error) {
      setError(res.error);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/purchases"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Purchases Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-border bg-background hover:bg-muted transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>

          {isIT && (
            <>
              <Link
                href={`/purchases/${purchase.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-border bg-background hover:bg-muted transition-colors shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-destructive/30 text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5 no-print">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Invoice Card Container */}
      <div className="glass-card p-6 md:p-8 space-y-8 print:shadow-none print:border-none">
        {/* Receipt Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-border/70">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Procurement Receipt
                </span>
                <h1 className="text-2xl font-black text-foreground tracking-tight">
                  {purchase.vendor}
                </h1>
              </div>
            </div>

            {purchase.title && (
              <p className="text-sm font-medium text-foreground italic">
                "{purchase.title}"
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{formattedDate}</span>
              </div>
              {purchase.invoiceNumber && (
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-muted-foreground">Invoice #:</span>
                  <span className="font-bold text-foreground">{purchase.invoiceNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Total Amount
            </span>
            <div className="text-3xl font-black text-foreground font-mono tracking-tight">
              {formatEGP(purchase.totalAmount)}
            </div>
            <div className="text-[11px] text-muted-foreground font-medium flex items-center sm:justify-end gap-1">
              <User className="w-3 h-3" />
              <span>Logged by {purchase.purchasedBy}</span>
            </div>
          </div>
        </div>

        {/* Notes if any */}
        {purchase.notes && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1">
            <span className="font-bold text-muted-foreground uppercase text-[10px]">
              Notes / Description:
            </span>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{purchase.notes}</p>
          </div>
        )}

        {/* Itemized Products Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-foreground">
              Purchased Products ({purchase.items.length})
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              Total: {totalUnits} units
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-muted/50 border-b border-border/80 text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Tracking Mode</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {purchase.items.map((item, idx) => {
                  const catDef = PURCHASE_CATEGORY_DEFINITIONS[item.category] || PURCHASE_CATEGORY_DEFINITIONS.OTHER;
                  const isModular = !!catDef.componentTypeMapping;

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* Product Name */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                            <span className="text-muted-foreground text-xs font-mono">#{idx + 1}</span>
                            <span>{item.name}</span>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-muted-foreground italic">{item.notes}</p>
                          )}

                          {/* Render spawned component tags if stocked */}
                          {item.components && item.components.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Stocked Parts:
                              </span>
                              {item.components.map((c) => (
                                <Link
                                  key={c.id}
                                  href={`/components`}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold border border-purple-500/20 transition-colors"
                                  title={`View ${c.serialNumber} in Components`}
                                >
                                  <span>{c.serialNumber}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </Link>
                              ))}
                            </div>
                          )}

                          {/* Option to stock unstocked modular items */}
                          {item.isTracked && isModular && (!item.components || item.components.length === 0) && isIT && (
                            <div className="pt-1 no-print">
                              <button
                                type="button"
                                disabled={stockingId === item.id}
                                onClick={() => handleStockItem(item.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all"
                              >
                                {stockingId === item.id ? (
                                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Layers className="w-3 h-3" />
                                    <span>+ Stock into IT Closet Shelf</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${catDef.badge}`}>
                          {catDef.shortLabel}
                        </span>
                      </td>

                      {/* Tracking Mode */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            item.isTracked
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {item.isTracked ? (
                            <>
                              <Package className="w-3 h-3" />
                              <span>Tracked Asset</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3" />
                              <span>Proof Only</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Unit Price */}
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                        {formatEGP(item.unitPrice)}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-foreground whitespace-nowrap">
                        {item.quantity}
                      </td>

                      {/* Line Total */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground text-sm whitespace-nowrap">
                        {formatEGP(item.totalPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Subtotals & Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl bg-muted/40 border border-border/80">
          <div className="space-y-1 text-xs">
            <div className="text-muted-foreground">
              <span>Tracked Hardware Spend: </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                {formatEGP(trackedSubtotal)}
              </strong>
            </div>
            <div className="text-muted-foreground">
              <span>Untracked Supplies & Consumables: </span>
              <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                {formatEGP(untrackedSubtotal)}
              </strong>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Grand Total Invoiced
            </span>
            <span className="text-2xl font-black text-foreground font-mono tracking-tight">
              {formatEGP(purchase.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
