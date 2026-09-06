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

export const PRINTER_BRAND_OPTIONS = [
  "HP",
  "Canon",
  "Epson",
  "Brother",
  "Ricoh",
  "Xerox",
  "Kyocera",
  "Lexmark",
  "Konica Minolta",
  "Pantum",
] as const;

export const PRINTER_STATUS_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  WORKING: {
    label: "Working",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  IN_REPAIR: {
    label: "In Repair",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
};

export const PRINTER_CONNECTION_TYPES = {
  ETHERNET: {
    label: "Wired Ethernet (LAN)",
    shortLabel: "Ethernet",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    description: "Connected to company local network switch via RJ-45 Ethernet cable.",
  },
  WIFI: {
    label: "Wi-Fi Wireless",
    shortLabel: "Wi-Fi",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    description: "Connected to office wireless network (802.11 b/g/n/ac).",
  },
  ETHERNET_AND_WIFI: {
    label: "Dual (LAN + Wi-Fi)",
    shortLabel: "Dual",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    description: "Supports simultaneous wired LAN and wireless office printing.",
  },
  USB: {
    label: "Direct USB Host",
    shortLabel: "USB",
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    description: "Direct local USB cable connection to dedicated computer.",
  },
} as const;

export const DEVICE_TYPES = {
  LAPTOP: {
    label: "Laptop",
    shortLabel: "Laptop",
    description: "Portable notebook computer with integrated screen & battery.",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  DESKTOP_PC: {
    label: "Desktop PC",
    shortLabel: "Desktop",
    description: "Tower, Mini PC, or Small Form Factor (SFF) workstation.",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  },
  WORKSTATION: {
    label: "Workstation Tower",
    shortLabel: "Workstation",
    description: "High-performance compute workstation for rendering or data analysis.",
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  },
  SERVER: {
    label: "Server Host",
    shortLabel: "Server",
    description: "Rackmount, blade, or standalone company server node.",
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
  },
} as const;

export const COMPONENT_TYPES = {
  RAM: {
    label: "RAM Memory Module",
    shortLabel: "RAM",
    category: "Memory",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25",
  },
  STORAGE_SSD: {
    label: "Solid State Drive (SSD / NVMe)",
    shortLabel: "SSD",
    category: "Storage",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
  },
  STORAGE_HDD: {
    label: "Hard Disk Drive (HDD)",
    shortLabel: "HDD",
    category: "Storage",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
  },
  GPU: {
    label: "Dedicated Graphics Card (GPU)",
    shortLabel: "GPU",
    category: "Graphics",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  },
  CPU: {
    label: "Central Processor (CPU)",
    shortLabel: "CPU",
    category: "Processing",
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
  },
  MOTHERBOARD: {
    label: "Motherboard / Mainboard",
    shortLabel: "Motherboard",
    category: "Board",
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25",
  },
  POWER_SUPPLY: {
    label: "Power Supply Unit (PSU)",
    shortLabel: "PSU",
    category: "Power",
    badge: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/25",
  },
  NETWORK_CARD: {
    label: "Network Adapter (Wi-Fi / 10GbE)",
    shortLabel: "NIC",
    category: "Network",
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
  },
  OTHER: {
    label: "Other Swappable Part",
    shortLabel: "Other",
    category: "Hardware",
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25",
  },
} as const;

export const COMPONENT_STATUS_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  IN_STOCK: {
    label: "In Stock (Available)",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  INSTALLED: {
    label: "Installed in PC",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  DEFECTIVE: {
    label: "Defective / In Repair",
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
  },
  RETIRED: {
    label: "Retired / Scrapped",
    bg: "bg-zinc-500/10 dark:bg-zinc-500/20",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-200 dark:border-zinc-800",
  },
};

export const COMPONENT_BRAND_OPTIONS = [
  "Samsung",
  "Crucial",
  "Corsair",
  "Kingston",
  "Western Digital",
  "Seagate",
  "Intel",
  "AMD",
  "Nvidia",
  "ASUS",
  "MSI",
  "Gigabyte",
  "EVGA",
  "Seasonic",
  "be quiet!",
  "G.Skill",
  "SK Hynix",
  "Sabrent",
  "Noctua",
  "TP-Link",
] as const;


