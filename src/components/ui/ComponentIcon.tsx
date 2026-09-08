import React from "react";
import {
  Layers,
  HardDrive,
  Disc,
  Gpu,
  Cpu,
  CircuitBoard,
  Zap,
  Network,
  Mouse,
  Keyboard,
  Monitor,
  Cable,
  Component as ComponentIconBase,
  Sticker,
  Package,
} from "lucide-react";
import { ComponentType, PurchaseCategory } from "@prisma/client";

export const COMPONENT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  RAM: Layers,
  STORAGE_SSD: HardDrive,
  STORAGE_HDD: Disc,
  GPU: Gpu,
  CPU: Cpu,
  MOTHERBOARD: CircuitBoard,
  POWER_SUPPLY: Zap,
  NETWORK_CARD: Network,
  PERIPHERAL_MOUSE: Mouse,
  PERIPHERAL_KEYBOARD: Keyboard,
  PERIPHERAL_MONITOR: Monitor,
  CABLES_ADAPTERS: Cable,
  OTHER: ComponentIconBase,
  STICKERS_COVERS: Sticker,
  CONSUMABLE: Package,
};

export const COMPONENT_THEME_MAP: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    badge: string;
  }
> = {
  RAM: {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/25",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25",
  },
  STORAGE_SSD: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/25",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
  },
  STORAGE_HDD: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/25",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
  },
  GPU: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/25",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  },
  CPU: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/25",
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
  },
  MOTHERBOARD: {
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/25",
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25",
  },
  POWER_SUPPLY: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-500/25",
    badge: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/25",
  },
  NETWORK_CARD: {
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/25",
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
  },
  PERIPHERAL_MOUSE: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/25",
    badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25",
  },
  PERIPHERAL_KEYBOARD: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/25",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
  },
  PERIPHERAL_MONITOR: {
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    border: "border-fuchsia-500/25",
    badge: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/25",
  },
  CABLES_ADAPTERS: {
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/25",
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25",
  },
  OTHER: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-500/25",
    badge: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25",
  },
  STICKERS_COVERS: {
    bg: "bg-pink-500/10",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-500/25",
    badge: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/25",
  },
  CONSUMABLE: {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/25",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
  },
};

/**
 * Returns the Lucide React component for a given component or purchase category
 */
export function getComponentIcon(type?: string | ComponentType | PurchaseCategory | null): React.ComponentType<{ className?: string }> {
  if (!type) return ComponentIconBase;
  return COMPONENT_ICON_MAP[type] || ComponentIconBase;
}

/**
 * Returns the Tailwind CSS theme classes for a given component or purchase category
 */
export function getComponentTheme(type?: string | ComponentType | PurchaseCategory | null) {
  if (!type) {
    return {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
      badge: "bg-muted text-muted-foreground border-border",
    };
  }
  return (
    COMPONENT_THEME_MAP[type] || {
      bg: "bg-slate-500/10",
      text: "text-slate-600 dark:text-slate-400",
      border: "border-slate-500/25",
      badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25",
    }
  );
}

interface ComponentIconBadgeProps {
  type?: string | ComponentType | PurchaseCategory | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  hoverScale?: boolean;
}

/**
 * Renders a stylized badge container displaying the specific category icon
 */
export function ComponentIconBadge({
  type,
  size = "md",
  className = "",
  hoverScale = false,
}: ComponentIconBadgeProps) {
  const Icon = getComponentIcon(type);
  const theme = getComponentTheme(type);

  const sizeClasses: Record<string, string> = {
    xs: "w-6 h-6 rounded-md",
    sm: "w-8 h-8 rounded-lg",
    md: "w-9 h-9 rounded-xl",
    lg: "w-11 h-11 rounded-xl",
    xl: "w-14 h-14 rounded-2xl",
  };

  const iconSizes: Record<string, string> = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-4.5 h-4.5",
    lg: "w-5 h-5",
    xl: "w-7 h-7",
  };

  return (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} ${theme.bg} ${theme.text} border ${theme.border} flex items-center justify-center shrink-0 ${
        hoverScale ? "group-hover:scale-105 transition-transform" : ""
      } ${className}`}
    >
      <Icon className={iconSizes[size] || iconSizes.md} />
    </div>
  );
}

/**
 * Simple inline icon renderer with optional custom class
 */
export function ComponentIcon({
  type,
  className = "w-4 h-4",
}: {
  type?: string | ComponentType | PurchaseCategory | null;
  className?: string;
}) {
  const Icon = getComponentIcon(type);
  return <Icon className={className} />;
}
