"use client";

import React from "react";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { Activity } from "lucide-react";

interface NavbarProps {
  user: {
    email: string;
    role: string;
  };
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="h-16 border-b border-border/70 bg-card/40 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold glow-pill-emerald">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>System Online</span>
        </span>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline-block">
          • IT Hardware Tracking System
        </span>
      </div>

      <div className="flex items-center gap-4">
        <RoleBadge role={user.role} />
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary/20 to-indigo-500/20 border border-primary/30 text-primary flex items-center justify-center font-extrabold text-xs shadow-sm">
          {user.email.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
