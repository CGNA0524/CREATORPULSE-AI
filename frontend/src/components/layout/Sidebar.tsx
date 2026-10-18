"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  LineChart,
  Calculator,
  Sliders,
  Sparkles,
  FileSpreadsheet,
  UploadCloud,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Influencer Intel", href: "/influencers", icon: Users },
  { label: "Analytics Explorer", href: "/analytics", icon: LineChart },
  {
    label: "Budget Optimization",
    href: "/optimization",
    icon: Calculator,
    badge: "SciPy",
    badgeColor: "bg-purple-900/60 text-purple-300 border-purple-500/30",
  },
  { label: "What-If Simulator", href: "/simulator", icon: Sliders },
  {
    label: "AI Insights Hub",
    href: "/insights",
    icon: Sparkles,
    badge: "AI",
    badgeColor: "bg-cyan-950/60 text-cyan-300 border-cyan-500/30",
  },
  { label: "Reports & Exports", href: "/reports", icon: FileSpreadsheet },
  { label: "Data Management", href: "/data-management", icon: UploadCloud },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-[#0B1020] transition-all duration-300 z-30 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white shadow-lg shadow-purple-500/20 shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
                CreatorPulse
              </span>
              <span className="text-[10px] font-semibold text-secondary tracking-widest uppercase">
                Optimization AI
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-card border border-transparent hover:border-border transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? "bg-primary/15 text-white border border-primary/30 shadow-sm"
                  : "text-muted hover:text-white hover:bg-card hover:border hover:border-border/50 border border-transparent"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-primary" : "text-slate-400 group-hover:text-white"
                }`}
              />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                        item.badgeColor || "bg-card text-muted"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Engine Status Footer */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-xl bg-card border border-border/80">
          <div className="flex items-center gap-2 mb-1.5">
            <Cpu className="w-4 h-4 text-secondary" />
            <span className="text-xs font-semibold text-slate-200">SciPy Engine</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-auto"></span>
          </div>
          <p className="text-[11px] text-muted leading-tight">
            SLSQP Constrained Solver Active & Verified.
          </p>
        </div>
      )}
    </aside>
  );
}
