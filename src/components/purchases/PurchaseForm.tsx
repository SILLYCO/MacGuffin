"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Plus,
  Trash2,
  Package,
  FileText,
  AlertCircle,
  Save,
  ArrowLeft,
  Store,
  Calendar,
  Sparkles,
  Layers,
  HelpCircle,
} from "lucide-react";
import { PurchaseCategory } from "@prisma/client";
import {
  PURCHASE_CATEGORY_DEFINITIONS,
  COMMON_VENDOR_SUGGESTIONS,
  formatEGP,
} from "@/lib/constants";
import { createPurchaseAction, updatePurchaseAction } from "@/lib/actions/purchases";

interface FormLineItem {
  id: string;
  name: string;
  category: PurchaseCategory;
  unitPrice: string;
  quantity: string;
  isTracked: boolean;
  autoStock: boolean;
  notes: string;
}

interface PurchaseFormProps {
  initialPurchase?: {
    id: string;
    title?: string | null;
    vendor: string;
    invoiceNumber?: string | null;
    purchaseDate: string | Date;
    notes?: string | null;
    items?: FormLineItem[];
  };
}

export function PurchaseForm({ initialPurchase }: PurchaseFormProps) {
  const router = useRouter();
  const isEditing = !!initialPurchase;

  // Header state
  const [vendor, setVendor] = useState(initialPurchase?.vendor || "");
  const [invoiceNumber, setInvoiceNumber] = useState(initialPurchase?.invoiceNumber || "");
  const [purchaseDate, setPurchaseDate] = useState(() => {
    if (initialPurchase?.purchaseDate) {
      const d = new Date(initialPurchase.purchaseDate);
      return d.toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  });
  const [title, setTitle] = useState(initialPurchase?.title || "");
  const [notes, setNotes] = useState(initialPurchase?.notes || "");

  // Line items state
  const [items, setItems] = useState<FormLineItem[]>(() => {
    if (initialPurchase?.items && initialPurchase.items.length > 0) {
      return initialPurchase.items;
    }
    return [
      {
        id: "item-" + Date.now(),
        name: "",
        category: PurchaseCategory.RAM,
        unitPrice: "",
        quantity: "1",
        isTracked: true,
        autoStock: true,
        notes: "",
      },
    ];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Financial live calculations
  let grandTotal = 0;
  let trackedSubtotal = 0;
  let untrackedSubtotal = 0;
  let totalUnits = 0;

  for (const item of items) {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const lineTotal = qty * price;
    grandTotal += lineTotal;
    totalUnits += qty;
    if (item.isTracked) {
      trackedSubtotal += lineTotal;
    } else {
      untrackedSubtotal += lineTotal;
    }
  }

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: "item-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
        name: "",
        category: PurchaseCategory.RAM,
        unitPrice: "",
        quantity: "1",
        isTracked: true,
        autoStock: true,
        notes: "",
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert("A purchase receipt must have at least one line item.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof FormLineItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;

        const updated = { ...it, [field]: value };

        // If category changed, update default isTracked and autoStock
        if (field === "category") {
          const catDef = PURCHASE_CATEGORY_DEFINITIONS[value as PurchaseCategory];
          if (catDef) {
            updated.isTracked = catDef.defaultTracked;
            updated.autoStock = catDef.defaultTracked && !!catDef.componentTypeMapping;
          }
        }

        // If isTracked turned off, autoStock must be false
        if (field === "isTracked" && !value) {
          updated.autoStock = false;
        }

        return updated;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vendor.trim()) {
      setError("Please provide a vendor or store name.");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one line item.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name.trim()) {
        setError(`Product name is required for line #${i + 1}.`);
        return;
      }
      const price = parseFloat(it.unitPrice);
      if (isNaN(price) || price < 0) {
        setError(`Valid unit price is required for line #${i + 1}.`);
        return;
      }
      const qty = parseInt(it.quantity);
      if (isNaN(qty) || qty <= 0) {
        setError(`Quantity for line #${i + 1} must be at least 1.`);
        return;
      }
    }

    setLoading(true);

    if (isEditing && initialPurchase) {
      const res = await updatePurchaseAction(initialPurchase.id, {
        title: title.trim() || undefined,
        vendor: vendor.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        purchaseDate,
        notes: notes.trim() || undefined,
      });

      setLoading(false);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push(`/purchases/${initialPurchase.id}`);
      }
    } else {
      const res = await createPurchaseAction({
        title: title.trim() || undefined,
        vendor: vendor.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        purchaseDate,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          name: it.name.trim(),
          category: it.category,
          unitPrice: parseFloat(it.unitPrice) || 0,
          quantity: parseInt(it.quantity) || 1,
          isTracked: it.isTracked,
          autoStock: it.autoStock,
          notes: it.notes?.trim() || undefined,
        })),
      });

      setLoading(false);
      if (res?.error) {
        setError(res.error);
      } else if (res?.purchaseId) {
        router.push(`/purchases/${res.purchaseId}`);
      } else {
        router.push("/purchases");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/purchases"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Purchases Directory</span>
        </Link>
      </div>

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <span>{isEditing ? "Edit Purchase Receipt" : "Log IT Purchase & Expenses"}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              EGP (ج.م)
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record invoice details, item pricing, and track physical assets vs untracked consumables
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Receipt Header Metadata */}
        <div className="glass-card p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <Store className="w-4 h-4 text-primary" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-foreground">
              Receipt & Vendor Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vendor */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Vendor / Store Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Amazon EG, El Bostan Mall, B.TECH, Local Supplier..."
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                required
              />
              {/* Quick Vendor Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-muted-foreground font-semibold self-center mr-1">
                  Suggestions:
                </span>
                {COMMON_VENDOR_SUGGESTIONS.slice(0, 5).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVendor(v)}
                    className="px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border/40"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Purchase Date <span className="text-primary">*</span>
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Invoice Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Invoice / Receipt # <span className="font-normal lowercase text-muted-foreground">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-9481 or Receipt barcode"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Optional Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Purchase Description / Title <span className="font-normal lowercase text-muted-foreground">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Hardware restock for Engineering floor"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Line Items Builder */}
        <div className="glass-card p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-foreground">
                Line Items & Pricing
              </h2>
            </div>
            <div className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? "product row" : "product rows"}
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const qtyNum = parseFloat(item.quantity) || 0;
              const priceNum = parseFloat(item.unitPrice) || 0;
              const lineTotal = qtyNum * priceNum;
              const catDef = PURCHASE_CATEGORY_DEFINITIONS[item.category] || PURCHASE_CATEGORY_DEFINITIONS.OTHER;
              const isModularComponent = !!catDef.componentTypeMapping;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all space-y-3.5 ${
                    item.isTracked
                      ? "bg-background/60 border-border/90 hover:border-emerald-500/40"
                      : "bg-muted/20 border-border/70 hover:border-amber-500/40"
                  }`}
                >
                  {/* Top Bar of item: Index, Tracked Status Badge, Line Total, Delete */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center font-mono text-xs font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                          item.isTracked
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
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
                            <span>Expense Proof Only</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Line Total
                        </span>
                        <span className="font-mono font-black text-sm text-foreground">
                          {formatEGP(lineTotal)}
                        </span>
                      </div>

                      {items.length > 1 && !isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remove line item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    {/* Product Name */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-muted-foreground">
                        Product / Item Name <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder={
                          item.category === "RAM"
                            ? "e.g. Kingston Fury Beast 16GB DDR4"
                            : item.category === "STICKERS_COVERS"
                            ? "e.g. English / Arabic Keyboard Stickers"
                            : "e.g. Logitech M185 Wireless Mouse"
                        }
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                        required
                      />
                    </div>

                    {/* Category Dropdown */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-muted-foreground">
                        Category
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => handleItemChange(item.id, "category", e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                      >
                        {Object.keys(PURCHASE_CATEGORY_DEFINITIONS).map((k) => (
                          <option key={k} value={k}>
                            {PURCHASE_CATEGORY_DEFINITIONS[k]?.label || k}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Unit Price in EGP */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-muted-foreground">
                        Unit Price (EGP) <span className="text-primary">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, "unitPrice", e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-muted-foreground">
                        Quantity <span className="text-primary">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-ring font-semibold text-center"
                        required
                      />
                    </div>
                  </div>

                  {/* Item Tracking Preferences & Auto-stocking */}
                  <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {/* Tracking Toggle */}
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.isTracked}
                          onChange={(e) => handleItemChange(item.id, "isTracked", e.target.checked)}
                          className="w-4 h-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
                        />
                        <span className="font-semibold text-foreground">
                          Track in Company Inventory
                        </span>
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        {item.isTracked
                          ? "(Treated as physical company hardware asset)"
                          : "(Untracked expense: recorded only as proof of purchase for accounting)"}
                      </span>
                    </div>

                    {/* Auto-Stock Option (if tracked & modular) */}
                    {item.isTracked && isModularComponent && !isEditing && (
                      <div className="flex items-center gap-2 sm:self-end">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/20 text-[11px] font-bold">
                          <input
                            type="checkbox"
                            checked={item.autoStock}
                            onChange={(e) => handleItemChange(item.id, "autoStock", e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-purple-400 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <Layers className="w-3.5 h-3.5 shrink-0" />
                          <span>Auto-create {item.quantity || "1"}x spare {catDef.shortLabel} in IT Closet</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border/80 hover:border-primary/50 text-xs font-bold text-primary hover:bg-primary/5 transition-all w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Product</span>
            </button>
          )}
        </div>

        {/* Section 3: Notes */}
        <div className="glass-card p-5 md:p-6 space-y-2">
          <label className="block text-xs font-bold uppercase text-muted-foreground">
            Internal Notes / Justification <span className="font-normal lowercase text-muted-foreground">(optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Purchased for Q3 developer onboarding laptops, approved by IT director..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Section 4: Floating Live Financial Total Summary */}
        <div className="glass-card p-5 md:p-6 bg-gradient-to-r from-primary/10 via-background to-purple-500/10 border-primary/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="grid grid-cols-3 gap-4 w-full md:w-auto text-center sm:text-left">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Products
              </span>
              <span className="font-extrabold text-lg text-foreground font-mono">
                {totalUnits} units
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Tracked Hardware
              </span>
              <span className="font-extrabold text-lg text-foreground font-mono">
                {formatEGP(trackedSubtotal)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Untracked Proofs
              </span>
              <span className="font-extrabold text-lg text-foreground font-mono">
                {formatEGP(untrackedSubtotal)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Grand Total Purchase
              </span>
              <span className="text-3xl font-black text-foreground font-mono tracking-tight">
                {formatEGP(grandTotal)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/purchases"
                className="px-4 py-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 disabled:opacity-50 transition-all shrink-0"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? "Update Receipt" : "Save Purchase Receipt"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
