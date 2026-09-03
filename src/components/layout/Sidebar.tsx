"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Laptop,
  Printer,
  Users,
  LayoutDashboard,
  Settings,
  LogOut,
  Sparkles,
  ScrollText,
} from "lucide-react";
import { RoleBadge } from "@/components/ui/RoleBadge";

interface SidebarProps {
  user: {
    email: string;
    role: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isIT = user.role === "IT";

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Devices",
      href: "/devices",
      icon: Laptop,
    },
    {
      label: "Printers",
      href: "/printers",
      icon: Printer,
    },
    {
      label: "Employees",
      href: "/employees",
      icon: Users,
    },
    {
      label: "Audit Logs",
      href: "/audit-logs",
      icon: ScrollText,
    },
    ...(isIT
      ? [
          {
            label: "User Accounts",
            href: "/settings/users",
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-card/60 backdrop-blur-2xl border-r border-border/80 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-border/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-blue-600 to-indigo-600 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 relative group">
            <Laptop className="w-5 h-5 relative z-10" />
            <div className="absolute inset-0 rounded-xl bg-primary/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-tight tracking-tight text-foreground flex items-center gap-1.5">
              <span>AssetTracker</span>
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Internal IT Portal
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3.5 py-2 text-[11px] font-extrabold text-muted-foreground/70 uppercase tracking-widest">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 translate-x-1"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-5 bg-white rounded-full absolute -left-1 top-1/2 -translate-y-1/2 shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-border/60 bg-muted/20">
        <div className="mb-3 px-2">
          <p className="text-xs font-bold text-foreground truncate" title={user.email}>
            {user.email}
          </p>
          <div className="mt-1.5">
            <RoleBadge role={user.role} />
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors border border-transparent hover:border-destructive/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
