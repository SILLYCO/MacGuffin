export const CPU_OPTIONS = [
  "Apple M1",
  "Apple M1 Pro",
  "Apple M1 Max",
  "Apple M2",
  "Apple M2 Pro",
  "Apple M2 Max",
  "Apple M3",
  "Apple M3 Pro",
  "Apple M3 Max",
  "Apple M4",
  "Apple M4 Pro",
  "Intel Core i5-12400",
  "Intel Core i5-13400H",
  "Intel Core i7-13700H",
  "Intel Core i7-14700K",
  "Intel Core i9-13900H",
  "Intel Core Ultra 7 155H",
  "AMD Ryzen 5 7600",
  "AMD Ryzen 7 7800X3D",
  "AMD Ryzen 7 7840HS",
  "AMD Ryzen 9 7900X",
  "AMD Ryzen AI 9 HX 370",
] as const;

export const RAM_OPTIONS = [
  "8 GB",
  "16 GB",
  "24 GB",
  "32 GB",
  "64 GB",
  "96 GB",
  "128 GB",
] as const;

export const STORAGE_OPTIONS = [
  "256 GB SSD",
  "512 GB SSD",
  "1 TB SSD",
  "2 TB SSD",
  "4 TB SSD",
] as const;

export const BRAND_OPTIONS = [
  "Apple",
  "Dell",
  "Lenovo",
  "HP",
  "ASUS",
  "Framework",
  "Microsoft",
  "Razer",
] as const;

export const DEPARTMENT_OPTIONS = [
  "Engineering",
  "Product",
  "Design",
  "IT & Security",
  "Sales",
  "Marketing",
  "Human Resources",
  "Finance",
  "Operations",
  "Executive",
] as const;

export const DEVICE_STATUS_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  IN_STOCK: {
    label: "In Stock",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  ASSIGNED: {
    label: "Assigned",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  IN_REPAIR: {
    label: "In Repair",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  RETIRED: {
    label: "Retired",
    bg: "bg-zinc-500/10 dark:bg-zinc-500/20",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-200 dark:border-zinc-800",
  },
};
