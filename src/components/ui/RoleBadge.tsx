import React from "react";
import { Role } from "@prisma/client";
import { ShieldCheck, Eye } from "lucide-react";

interface RoleBadgeProps {
  role: Role | string;
  className?: string;
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const isIT = role === "IT";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border backdrop-blur-md transition-all ${
        isIT
          ? "bg-purple-500/10 text-purple-700 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40 glow-pill-purple"
          : "bg-slate-500/10 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-800"
      } ${className}`}
    >
      {isIT ? <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
      <span>{isIT ? "IT Administrator" : "Manager (Read-Only)"}</span>
    </span>
  );
}
