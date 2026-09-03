import React from "react";
import { DeviceStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: DeviceStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  let styleConfig = {
    label: status,
    bg: "bg-slate-500/10 dark:bg-slate-500/20",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-800",
    dotColor: "bg-slate-400",
    glowClass: "",
  };

  switch (status) {
    case "WORKING":
      styleConfig = {
        label: "Working",
        bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
        text: "text-emerald-700 dark:text-emerald-300 font-bold",
        border: "border-emerald-500/30 dark:border-emerald-500/40",
        dotColor: "bg-emerald-400 animate-pulse-glow",
        glowClass: "glow-pill-emerald",
      };
      break;
    case "IN_STOCK":
      styleConfig = {
        label: "In Stock",
        bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
        text: "text-emerald-700 dark:text-emerald-300 font-bold",
        border: "border-emerald-500/30 dark:border-emerald-500/40",
        dotColor: "bg-emerald-400 animate-pulse-glow",
        glowClass: "glow-pill-emerald",
      };
      break;
    case "ASSIGNED":
      styleConfig = {
        label: "Assigned",
        bg: "bg-blue-500/10 dark:bg-blue-500/15",
        text: "text-blue-700 dark:text-blue-300 font-bold",
        border: "border-blue-500/30 dark:border-blue-500/40",
        dotColor: "bg-blue-400 animate-pulse-glow",
        glowClass: "glow-pill-blue",
      };
      break;
    case "IN_REPAIR":
      styleConfig = {
        label: "In Repair",
        bg: "bg-amber-500/10 dark:bg-amber-500/15",
        text: "text-amber-700 dark:text-amber-300 font-bold",
        border: "border-amber-500/30 dark:border-amber-500/40",
        dotColor: "bg-amber-400 animate-pulse-glow",
        glowClass: "glow-pill-amber",
      };
      break;
    case "RETIRED":
      styleConfig = {
        label: "Retired",
        bg: "bg-zinc-500/10 dark:bg-zinc-500/20",
        text: "text-zinc-600 dark:text-zinc-400 font-semibold",
        border: "border-zinc-300 dark:border-zinc-800",
        dotColor: "bg-zinc-500",
        glowClass: "",
      };
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-md transition-all ${styleConfig.bg} ${styleConfig.text} ${styleConfig.border} ${styleConfig.glowClass} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${styleConfig.dotColor}`} />
      <span>{styleConfig.label}</span>
    </span>
  );
}
