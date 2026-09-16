"use client";

import React from "react";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { Activity, Menu } from "lucide-react";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";

interface NavbarProps {
  user: {
    email: string;
    role: string;
  };
  onOpenMobileNav?: () => void;
}

export function Navbar({ user, onOpenMobileNav }: NavbarProps) {
  return (
    <header className="h-16 border-b border-border/70 bg-card/40 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 -ml-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold glow-pill-emerald">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden xs:inline">System Online</span>
          <span className="xs:hidden">Online</span>
        </span>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:inline-block">
          • IT Hardware Tracking System
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ExportExcelButton scope="all" label="Export (.xlsx)" size="sm" responsive={true} />
        <RoleBadge role={user.role} />
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-primary/20 to-indigo-500/20 border border-primary/30 text-primary flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
          {user.email.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
