/**
 * Utility functions for parsing hardware capacities, formatting display strings,
 * and dynamically aggregating live computer specifications from mounted modular components.
 */

export interface HardwarePart {
  type: string;
  brand: string;
  model: string;
  capacity?: string | null;
  specs?: string | null;
}

export interface ComputedLiveSpecs {
  ramSummary: string;
  ramDetails: string;
  storageSummary: string;
  storageDetails: string;
  gpuSummary?: string | null;
  isRamDerived: boolean;
  isStorageDerived: boolean;
  hasModularComponents: boolean;
  totalModularPartsCount: number;
}

/**
 * Parses a capacity string (e.g., "16 GB", "1 TB", "512 GB SSD", "2.5 TB") into numeric Gigabytes (GB).
 */
export function parseCapacityInGigabytes(capacityStr?: string | null): number {
  if (!capacityStr) return 0;

  const clean = capacityStr.trim();
  const match = clean.match(/^([\d.]+)\s*(GB|TB|MB)?/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  if (isNaN(value)) return 0;

  const unit = (match[2] || "GB").toUpperCase();
  if (unit === "TB") {
    return value * 1024;
  }
  if (unit === "MB") {
    return Math.round((value / 1024) * 10) / 10;
  }
  return value;
}

/**
 * Formats a numeric capacity in Gigabytes into clean human-readable text (e.g. 1024 -> "1 TB", 1536 -> "1.5 TB", 24 -> "24 GB").
 */
export function formatGigabytes(totalGB: number, defaultSuffix = ""): string {
  if (totalGB <= 0) return defaultSuffix ? `0 ${defaultSuffix}` : "0 GB";

  if (totalGB >= 1024 && totalGB % 512 === 0) {
    const tb = totalGB / 1024;
    return `${Number.isInteger(tb) ? tb : tb.toFixed(1)} TB`;
  }

  if (totalGB >= 1024) {
    const tb = totalGB / 1024;
    return `${tb.toFixed(tb % 1 === 0 ? 0 : 2)} TB`;
  }

  return `${Math.round(totalGB)} GB`;
}

/**
 * Dynamically computes a computer's live RAM, Storage, and GPU specs
 * by aggregating all physical modular components currently mounted in it.
 * Falls back to static device baseline strings if no individual parts are mounted.
 */
export function computeDeviceLiveSpecs(device: {
  ram?: string | null;
  storage?: string | null;
  components?: HardwarePart[] | null;
}): ComputedLiveSpecs {
  const parts = device.components || [];

  const ramParts = parts.filter((p) => p.type === "RAM");
  const storageParts = parts.filter(
    (p) => p.type === "STORAGE_SSD" || p.type === "STORAGE_HDD"
  );
  const gpuParts = parts.filter((p) => p.type === "GPU");

  // 1. RAM Aggregation
  let ramSummary = device.ram?.trim() || "Modular / None";
  let ramDetails = "";
  const isRamDerived = ramParts.length > 0;

  if (isRamDerived) {
    let totalRamGB = 0;
    const moduleCapacities: string[] = [];

    for (const r of ramParts) {
      const gb = parseCapacityInGigabytes(r.capacity);
      totalRamGB += gb;
      moduleCapacities.push(r.capacity ? r.capacity.trim() : "Module");
    }

    ramSummary = formatGigabytes(totalRamGB);
    ramDetails =
      ramParts.length === 1
        ? `1 module (${moduleCapacities[0]})`
        : `${ramParts.length} modules (${moduleCapacities.join(" + ")})`;
  } else if (device.ram && device.ram.trim()) {
    ramSummary = device.ram.trim();
    ramDetails = "Factory baseline";
  }

  // 2. Storage Aggregation
  let storageSummary = device.storage?.trim() || "Modular / None";
  let storageDetails = "";
  const isStorageDerived = storageParts.length > 0;

  if (isStorageDerived) {
    let totalStorageGB = 0;
    const driveCapacities: string[] = [];
    let hasNvme = false;
    let hasHdd = false;

    for (const s of storageParts) {
      const gb = parseCapacityInGigabytes(s.capacity);
      totalStorageGB += gb;
      driveCapacities.push(s.capacity ? s.capacity.trim() : "Drive");
      if (s.type === "STORAGE_HDD") hasHdd = true;
      if (s.specs?.toLowerCase().includes("nvme") || s.model.toLowerCase().includes("nvme")) {
        hasNvme = true;
      }
    }

    const typeLabel = hasHdd && !hasNvme ? "HDD" : hasNvme ? "NVMe SSD" : "SSD";
    storageSummary = `${formatGigabytes(totalStorageGB)} ${typeLabel}`;
    storageDetails =
      storageParts.length === 1
        ? `1 drive (${driveCapacities[0]})`
        : `${storageParts.length} drives (${driveCapacities.join(" + ")})`;
  } else if (device.storage && device.storage.trim()) {
    storageSummary = device.storage.trim();
    storageDetails = "Factory baseline";
  }

  // 3. GPU Detection
  let gpuSummary: string | null = null;
  if (gpuParts.length > 0) {
    const gpu = gpuParts[0];
    gpuSummary = `${gpu.brand} ${gpu.model}${gpu.capacity ? ` (${gpu.capacity})` : ""}`;
  }

  return {
    ramSummary,
    ramDetails,
    storageSummary,
    storageDetails,
    gpuSummary,
    isRamDerived,
    isStorageDerived,
    hasModularComponents: parts.length > 0,
    totalModularPartsCount: parts.length,
  };
}
