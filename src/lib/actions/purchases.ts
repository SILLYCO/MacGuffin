"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireITRole } from "@/lib/permissions";
import {
  PurchaseCategory,
  ComponentType,
  ComponentStatus,
  ComponentTransferAction,
  AuditAction,
  AuditEntityType,
  Role,
} from "@prisma/client";
import { logAuditAction } from "@/lib/audit";
import { COMPONENT_BRAND_OPTIONS } from "@/lib/constants";

export interface PurchaseItemInput {
  name: string;
  category: PurchaseCategory;
  unitPrice: number;
  quantity: number;
  isTracked: boolean;
  autoStock?: boolean;
  notes?: string;
}

export interface CreatePurchaseInput {
  title?: string;
  vendor: string;
  invoiceNumber?: string;
  purchaseDate?: string;
  notes?: string;
  items: PurchaseItemInput[];
}

export interface UpdatePurchaseInput {
  title?: string;
  vendor: string;
  invoiceNumber?: string;
  purchaseDate?: string;
  notes?: string;
}

function parseCapacityFromName(name: string): string | null {
  const match = name.match(/(\d+\s*(?:GB|TB|MB|W))/i);
  return match ? match[1].toUpperCase() : null;
}

function parseBrandFromName(name: string): string {
  const lower = name.toLowerCase();
  for (const brand of COMPONENT_BRAND_OPTIONS) {
    if (brand !== "Generic" && lower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return "Generic";
}

function mapCategoryToComponentType(category: PurchaseCategory): ComponentType | null {
  switch (category) {
    case PurchaseCategory.RAM:
      return ComponentType.RAM;
    case PurchaseCategory.STORAGE_SSD:
      return ComponentType.STORAGE_SSD;
    case PurchaseCategory.STORAGE_HDD:
      return ComponentType.STORAGE_HDD;
    case PurchaseCategory.GPU:
      return ComponentType.GPU;
    case PurchaseCategory.CPU:
      return ComponentType.CPU;
    case PurchaseCategory.MOTHERBOARD:
      return ComponentType.MOTHERBOARD;
    case PurchaseCategory.POWER_SUPPLY:
      return ComponentType.POWER_SUPPLY;
    case PurchaseCategory.NETWORK_CARD:
      return ComponentType.NETWORK_CARD;
    case PurchaseCategory.PERIPHERAL_MOUSE:
      return ComponentType.PERIPHERAL_MOUSE;
    case PurchaseCategory.PERIPHERAL_KEYBOARD:
      return ComponentType.PERIPHERAL_KEYBOARD;
    case PurchaseCategory.PERIPHERAL_MONITOR:
      return ComponentType.PERIPHERAL_MONITOR;
    case PurchaseCategory.CABLES_ADAPTERS:
      return ComponentType.CABLES_ADAPTERS;
    case PurchaseCategory.OTHER:
      return ComponentType.OTHER;
    default:
      return null;
  }
}

function getSerialPrefix(compType: ComponentType): string {
  switch (compType) {
    case ComponentType.RAM:
      return "RAM";
    case ComponentType.STORAGE_SSD:
      return "SSD";
    case ComponentType.STORAGE_HDD:
      return "HDD";
    case ComponentType.GPU:
      return "GPU";
    case ComponentType.CPU:
      return "CPU";
    case ComponentType.MOTHERBOARD:
      return "MOB";
    case ComponentType.POWER_SUPPLY:
      return "PSU";
    case ComponentType.NETWORK_CARD:
      return "NIC";
    case ComponentType.PERIPHERAL_MOUSE:
      return "MOU";
    case ComponentType.PERIPHERAL_KEYBOARD:
      return "KBD";
    case ComponentType.PERIPHERAL_MONITOR:
      return "MON";
    case ComponentType.CABLES_ADAPTERS:
      return "CBL";
    default:
      return "CMP";
  }
}

/**
 * Log a new IT Purchase with multiple line items.
 * If line items are marked tracked with autoStock = true, automatically generates
 * Component inventory units in the IT Closet Shelf.
 * Uses sequential queries for Supabase transaction pooler (PgBouncer) compatibility.
 */
export async function createPurchaseAction(input: CreatePurchaseInput) {
  const user = await requireITRole();

  if (!input.vendor || !input.vendor.trim()) {
    return { error: "Vendor or store name is required." };
  }

  if (!input.items || input.items.length === 0) {
    return { error: "Please add at least one line item to this purchase." };
  }

  // Validate line items
  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    if (!item.name || !item.name.trim()) {
      return { error: `Item #${i + 1} is missing a product name.` };
    }
    if (isNaN(item.unitPrice) || item.unitPrice < 0) {
      return { error: `Item #${i + 1} has an invalid price.` };
    }
    if (isNaN(item.quantity) || item.quantity <= 0) {
      return { error: `Item #${i + 1} must have a quantity of at least 1.` };
    }
  }

  const purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : new Date();

  try {
    // Calculate total
    let totalAmount = 0;
    const sanitizedItems = input.items.map((item) => {
      const qty = Math.max(1, Math.floor(Number(item.quantity)));
      const price = Math.max(0, Number(item.unitPrice));
      const lineTotal = Number((qty * price).toFixed(2));
      totalAmount += lineTotal;
      return {
        name: item.name.trim(),
        category: item.category,
        unitPrice: price,
        quantity: qty,
        totalPrice: lineTotal,
        isTracked: item.isTracked,
        autoStock: !!item.autoStock,
        notes: item.notes?.trim() || null,
      };
    });

    totalAmount = Number(totalAmount.toFixed(2));

    // Create purchase header directly (sequential execution for PgBouncer transaction mode)
    const purchase = await db.purchase.create({
      data: {
        title: input.title?.trim() || null,
        vendor: input.vendor.trim(),
        invoiceNumber: input.invoiceNumber?.trim() || null,
        purchaseDate,
        totalAmount,
        currency: "EGP",
        notes: input.notes?.trim() || null,
        purchasedBy: user.email,
      },
    });

    let trackedCount = 0;
    let untrackedCount = 0;
    let totalStockedComponents = 0;

    for (const item of sanitizedItems) {
      if (item.isTracked) {
        trackedCount += item.quantity;
      } else {
        untrackedCount += item.quantity;
      }

      const purchaseItem = await db.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          name: item.name,
          category: item.category,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          isTracked: item.isTracked,
          autoStocked: false,
          notes: item.notes,
        },
      });

      // Auto-stock into Component closet if requested and modular/hardware
      const compType = mapCategoryToComponentType(item.category);
      if (item.isTracked && item.autoStock && compType) {
        const brand = parseBrandFromName(item.name);
        const capacity = parseCapacityFromName(item.name);
        const prefix = getSerialPrefix(compType);

        for (let q = 0; q < item.quantity; q++) {
          const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
          const serial = `GEN-${prefix}-${Date.now().toString(36).toUpperCase()}-${randSuffix}-${q + 1}`;

          const component = await db.component.create({
            data: {
              type: compType,
              brand,
              model: item.name,
              capacity,
              serialNumber: serial,
              status: ComponentStatus.IN_STOCK,
              purchaseItemId: purchaseItem.id,
              purchasePrice: item.unitPrice,
              notes: `Purchased from ${purchase.vendor} (${purchase.invoiceNumber || "Invoice"}) at ${item.unitPrice} EGP`,
            },
          });

          await db.componentTransfer.create({
            data: {
              componentId: component.id,
              fromDeviceId: null,
              fromDeviceName: `Purchase: ${purchase.vendor}`,
              toDeviceId: null,
              toDeviceName: "IT Storage Stock",
              actionType: ComponentTransferAction.INSTALLED_FROM_STOCK,
              reason: `Procured in bulk receipt #${purchase.invoiceNumber || purchase.id.substring(0, 8)}`,
              performedByEmail: user.email,
            },
          });

          totalStockedComponents++;
        }

        await db.purchaseItem.update({
          where: { id: purchaseItem.id },
          data: { autoStocked: true },
        });
      }
    }

    // Log audit action
    await logAuditAction({
      action: AuditAction.PURCHASE_CREATED,
      entityType: AuditEntityType.PURCHASE,
      entityId: purchase.id,
      entityName: `${purchase.vendor} (${totalAmount} EGP)`,
      details: {
        vendor: purchase.vendor,
        invoiceNumber: purchase.invoiceNumber,
        totalAmount,
        itemsCount: input.items.length,
        trackedUnits: trackedCount,
        untrackedUnits: untrackedCount,
        componentsStocked: totalStockedComponents,
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
      },
    });

    revalidatePath("/purchases");
    revalidatePath(`/purchases/${purchase.id}`);
    revalidatePath("/components");
    revalidatePath("/dashboard");
    return { success: true, purchaseId: purchase.id };
  } catch (error: any) {
    console.error("createPurchaseAction error:", error);
    return { error: error?.message || "Failed to create purchase record." };
  }
}

/**
 * Update purchase header metadata (vendor, invoice #, date, notes).
 */
export async function updatePurchaseAction(purchaseId: string, input: UpdatePurchaseInput) {
  const user = await requireITRole();

  if (!input.vendor || !input.vendor.trim()) {
    return { error: "Vendor name is required." };
  }

  const existing = await db.purchase.findUnique({
    where: { id: purchaseId },
  });

  if (!existing) {
    return { error: "Purchase record not found." };
  }

  const purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : existing.purchaseDate;

  try {
    const updated = await db.purchase.update({
      where: { id: purchaseId },
      data: {
        title: input.title?.trim() || null,
        vendor: input.vendor.trim(),
        invoiceNumber: input.invoiceNumber?.trim() || null,
        purchaseDate,
        notes: input.notes?.trim() || null,
      },
    });

    await logAuditAction({
      action: AuditAction.PURCHASE_UPDATED,
      entityType: AuditEntityType.PURCHASE,
      entityId: purchaseId,
      entityName: `${updated.vendor} (${updated.totalAmount} EGP)`,
      details: {
        vendor: updated.vendor,
        invoiceNumber: updated.invoiceNumber,
        notes: updated.notes,
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
      },
    });

    revalidatePath("/purchases");
    revalidatePath(`/purchases/${purchaseId}`);
    return { success: true };
  } catch (error: any) {
    console.error("updatePurchaseAction error:", error);
    return { error: error?.message || "Failed to update purchase." };
  }
}

/**
 * Delete a purchase and cascade delete its line items.
 */
export async function deletePurchaseAction(purchaseId: string) {
  const user = await requireITRole();

  const purchase = await db.purchase.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  });

  if (!purchase) {
    return { error: "Purchase record not found." };
  }

  try {
    await db.purchase.delete({
      where: { id: purchaseId },
    });

    await logAuditAction({
      action: AuditAction.PURCHASE_DELETED,
      entityType: AuditEntityType.PURCHASE,
      entityId: purchaseId,
      entityName: `${purchase.vendor} (${purchase.totalAmount} EGP)`,
      details: {
        vendor: purchase.vendor,
        invoiceNumber: purchase.invoiceNumber,
        totalAmount: purchase.totalAmount,
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
      },
    });

    revalidatePath("/purchases");
    revalidatePath("/components");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("deletePurchaseAction error:", error);
    return { error: error?.message || "Failed to delete purchase." };
  }
}

/**
 * Manually stock an existing tracked purchase item into the Component inventory closet.
 * Uses sequential queries for PgBouncer compatibility.
 */
export async function stockPurchaseItemAction(purchaseItemId: string) {
  const user = await requireITRole();

  const item = await db.purchaseItem.findUnique({
    where: { id: purchaseItemId },
    include: { purchase: true, components: true },
  });

  if (!item) {
    return { error: "Purchase item not found." };
  }

  if (item.autoStocked || item.components.length > 0) {
    return { error: "This item has already been stocked into component inventory." };
  }

  const compType = mapCategoryToComponentType(item.category) || ComponentType.OTHER;
  const brand = parseBrandFromName(item.name);
  const capacity = parseCapacityFromName(item.name);
  const prefix = getSerialPrefix(compType);

  try {
    for (let q = 0; q < item.quantity; q++) {
      const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const serial = `GEN-${prefix}-${Date.now().toString(36).toUpperCase()}-${randSuffix}-${q + 1}`;

      const component = await db.component.create({
        data: {
          type: compType,
          brand,
          model: item.name,
          capacity,
          serialNumber: serial,
          status: ComponentStatus.IN_STOCK,
          purchaseItemId: item.id,
          purchasePrice: item.unitPrice,
          notes: `Stocked from purchase: ${item.purchase.vendor} at ${item.unitPrice} EGP`,
        },
      });

      await db.componentTransfer.create({
        data: {
          componentId: component.id,
          fromDeviceId: null,
          fromDeviceName: `Purchase: ${item.purchase.vendor}`,
          toDeviceId: null,
          toDeviceName: "IT Storage Stock",
          actionType: ComponentTransferAction.INSTALLED_FROM_STOCK,
          reason: `Manual stock receipt from invoice #${item.purchase.invoiceNumber || item.purchase.id.substring(0, 8)}`,
          performedByEmail: user.email,
        },
      });
    }

    await db.purchaseItem.update({
      where: { id: item.id },
      data: { autoStocked: true },
    });

    revalidatePath(`/purchases/${item.purchaseId}`);
    revalidatePath("/purchases");
    revalidatePath("/components");
    return { success: true };
  } catch (error: any) {
    console.error("stockPurchaseItemAction error:", error);
    return { error: error?.message || "Failed to stock components into inventory." };
  }
}
