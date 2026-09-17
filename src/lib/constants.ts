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
  PERIPHERAL_MOUSE: {
    label: "Mouse (USB / Wireless)",
    shortLabel: "Mouse",
    category: "Peripheral",
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25",
  },
  PERIPHERAL_KEYBOARD: {
    label: "Keyboard (USB / Wireless)",
    shortLabel: "Keyboard",
    category: "Peripheral",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
  },
  PERIPHERAL_MONITOR: {
    label: "Monitor / External Display",
    shortLabel: "Monitor",
    category: "Display",
    badge: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/25",
  },
  CABLES_ADAPTERS: {
    label: "Cables & Adapters",
    shortLabel: "Cables",
    category: "Accessory",
    badge: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25",
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
  "Generic",
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

export const PURCHASE_CATEGORY_DEFINITIONS: Record<
  string,
  {
    label: string;
    shortLabel: string;
    badge: string;
    defaultTracked: boolean;
    componentTypeMapping?: string;
  }
> = {
  RAM: {
    label: "RAM / Memory",
    shortLabel: "RAM",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    defaultTracked: true,
    componentTypeMapping: "RAM",
  },
  STORAGE_SSD: {
    label: "SSD Storage",
    shortLabel: "SSD",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    defaultTracked: true,
    componentTypeMapping: "STORAGE_SSD",
  },
  STORAGE_HDD: {
    label: "HDD Hard Drive",
    shortLabel: "HDD",
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
    defaultTracked: true,
    componentTypeMapping: "STORAGE_HDD",
  },
  GPU: {
    label: "Graphics Card (GPU)",
    shortLabel: "GPU",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    defaultTracked: true,
    componentTypeMapping: "GPU",
  },
  CPU: {
    label: "Processor (CPU)",
    shortLabel: "CPU",
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    defaultTracked: true,
    componentTypeMapping: "CPU",
  },
  MOTHERBOARD: {
    label: "Motherboard",
    shortLabel: "Mobo",
    badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
    defaultTracked: true,
    componentTypeMapping: "MOTHERBOARD",
  },
  POWER_SUPPLY: {
    label: "Power Supply (PSU)",
    shortLabel: "PSU",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    defaultTracked: true,
    componentTypeMapping: "POWER_SUPPLY",
  },
  NETWORK_CARD: {
    label: "Network Adapter (Wi-Fi / 10GbE)",
    shortLabel: "NIC",
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
    defaultTracked: true,
    componentTypeMapping: "NETWORK_CARD",
  },
  PERIPHERAL_MOUSE: {
    label: "Mouse",
    shortLabel: "Mouse",
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
    defaultTracked: true,
    componentTypeMapping: "PERIPHERAL_MOUSE",
  },
  PERIPHERAL_KEYBOARD: {
    label: "Keyboard",
    shortLabel: "Keyboard",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
    defaultTracked: true,
    componentTypeMapping: "PERIPHERAL_KEYBOARD",
  },
  PERIPHERAL_MONITOR: {
    label: "Monitor / Display",
    shortLabel: "Monitor",
    badge: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/20",
    defaultTracked: true,
    componentTypeMapping: "PERIPHERAL_MONITOR",
  },
  CABLES_ADAPTERS: {
    label: "Cables & Adapters",
    shortLabel: "Cables",
    badge: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
    defaultTracked: false,
    componentTypeMapping: "CABLES_ADAPTERS",
  },
  STICKERS_COVERS: {
    label: "Keyboard Stickers & Covers",
    shortLabel: "Stickers",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
    defaultTracked: false,
  },
  CONSUMABLE: {
    label: "Consumable / Supplies (Paste, Spray, Ties)",
    shortLabel: "Consumable",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    defaultTracked: false,
  },
  OTHER: {
    label: "Other Custom Item",
    shortLabel: "Other",
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    defaultTracked: false,
    componentTypeMapping: "OTHER",
  },
};

export function formatEGP(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0.00 EGP";
  return (
    new Intl.NumberFormat("en-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " EGP"
  );
}

export const COMMON_VENDOR_SUGGESTIONS = [
  "Amazon EG",
  "El Bostan Mall",
  "B.TECH",
  "Noon Egypt",
  "2B Egypt",
  "Raya Shop",
  "Compuscience",
  "Local Hardware Store",
  "Direct Distributor",
] as const;

export const NETWORK_DEVICE_TYPE_CONFIG: Record<
  string,
  { label: string; iconName: string; badge: string; border: string }
> = {
  ROUTER: {
    label: "Router / Gateway",
    iconName: "Router",
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
    border: "border-indigo-500",
  },
  SWITCH: {
    label: "Network Switch",
    iconName: "Server",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    border: "border-blue-500",
  },
  ACCESS_POINT: {
    label: "Access Point (AP)",
    iconName: "Wifi",
    badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
    border: "border-cyan-500",
  },
  FIREWALL: {
    label: "Firewall / Appliance",
    iconName: "Shield",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    border: "border-rose-500",
  },
  PATCH_PANEL: {
    label: "Patch Panel",
    iconName: "Grid",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    border: "border-amber-500",
  },
  OTHER: {
    label: "Other Device",
    iconName: "Network",
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
    border: "border-slate-500",
  },
};

export const NETWORK_DEVICE_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  ONLINE: {
    label: "Online / Operational",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500 animate-pulse",
  },
  OFFLINE: {
    label: "Offline / Disconnected",
    bg: "bg-rose-500/10 border-rose-500/20",
    text: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  MAINTENANCE: {
    label: "Maintenance / Upgrading",
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};

export const CABLE_TYPE_OPTIONS: Record<string, { label: string; category: "COPPER" | "FIBER" | "OTHER" }> = {
  CAT5E: { label: "Cat5e UTP (1 Gbps)", category: "COPPER" },
  CAT6: { label: "Cat6 UTP / STP (1-10 Gbps)", category: "COPPER" },
  CAT6A: { label: "Cat6A 10G Shielded (10 Gbps)", category: "COPPER" },
  CAT7: { label: "Cat7 Shielded (10 Gbps)", category: "COPPER" },
  CAT8: { label: "Cat8 40G Ultra-High Speed", category: "COPPER" },
  FIBER_SINGLE_MODE: { label: "Single-Mode Fiber (SMF Yellow)", category: "FIBER" },
  FIBER_MULTI_MODE: { label: "Multi-Mode Fiber (MMF Aqua / Orange)", category: "FIBER" },
  DAC_COPPER: { label: "Direct Attach SFP+ Copper (DAC)", category: "COPPER" },
  OTHER: { label: "Custom / Other Cable", category: "OTHER" },
};

export const CONNECTION_SPEED_OPTIONS: Record<string, { label: string; short: string }> = {
  SPEED_100_MBPS: { label: "100 Mbps (Fast Ethernet)", short: "100M" },
  SPEED_1_GBPS: { label: "1 Gbps (Gigabit)", short: "1G" },
  SPEED_2_5_GBPS: { label: "2.5 Gbps (Multi-Gig)", short: "2.5G" },
  SPEED_10_GBPS: { label: "10 Gbps (10G SFP+/RJ45)", short: "10G" },
  SPEED_40_GBPS: { label: "40 Gbps QSFP+", short: "40G" },
  SPEED_100_GBPS: { label: "100 Gbps QSFP28", short: "100G" },
  OTHER: { label: "Other / Unspecified", short: "Auto" },
};

export const CABLE_COLOR_PALETTE = [
  { name: "Blue", label: "Blue (General Data)", hex: "#3b82f6", bg: "bg-blue-500" },
  { name: "Yellow", label: "Yellow (VoIP / Phone)", hex: "#eab308", bg: "bg-yellow-500" },
  { name: "Orange", label: "Orange (Printer / Peripheral)", hex: "#f97316", bg: "bg-orange-500" },
  { name: "Green", label: "Green (PoE / CCTV / AP)", hex: "#22c55e", bg: "bg-green-500" },
  { name: "Red", label: "Red (Uplink / Critical / Server)", hex: "#ef4444", bg: "bg-red-500" },
  { name: "Purple", label: "Purple (Management / Trunk)", hex: "#a855f7", bg: "bg-purple-500" },
  { name: "Gray", label: "Gray (Standard Patch)", hex: "#6b7280", bg: "bg-gray-500" },
  { name: "White", label: "White (Wall Drop)", hex: "#e5e7eb", bg: "bg-slate-200" },
  { name: "Black", label: "Black (Outdoor / Direct)", hex: "#1f2937", bg: "bg-zinc-800" },
] as const;

export const COMMON_SWITCH_PORT_PRESETS = [8, 16, 24, 48] as const;

export const NETWORK_BRAND_PRESETS = [
  "Cisco",
  "Ubiquiti UniFi",
  "MikroTik",
  "TP-Link Omada",
  "Aruba (HPE)",
  "Dell Networking",
  "Netgear",
  "Fortinet",
  "Juniper",
  "D-Link",
  "Other",
] as const;




