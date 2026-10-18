"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { User } from "@/types";
import {
  Building2,
  Coins,
  LogOut,
  User as UserIcon,
  Database,
  CheckCircle2,
  Bell,
  Sparkles,
} from "lucide-react";

export default function TopNavbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to get current user from localStorage or API
    const fetchUser = async () => {
      try {
        const u = await api.get<User>("/auth/me");
        setUser(u);
      } catch (_) {
        // Fallback demo user if running without active cookie
        setUser({
          id: 1,
          name: "Marketing Lead",
          email: "admin@creatorpulse.ai",
          is_active: true,
          created_at: new Date().toISOString(),
          organization_name: "PulseBrands Global",
          role: "owner",
        });
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {}
    api.removeAuthToken();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-border bg-[#0B1020]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Organization context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-slate-200">
            {user?.organization_name || "PulseBrands Global"}
          </span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
            {user?.role || "Owner"}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs text-muted">
          <Coins className="w-3.5 h-3.5 text-secondary" />
          <span>Currency: <strong className="text-slate-200">INR (₹)</strong></span>
        </div>
      </div>

      {/* Right: Actions and User */}
      <div className="flex items-center gap-3">
        {/* Live System Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-medium">Data Grounded • SciPy SLSQP</span>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-800 flex items-center justify-center text-white text-xs font-bold border border-white/10">
            {user?.name ? user.name.charAt(0).toUpperCase() : "M"}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
              {user?.name || "Marketing Lead"}
            </span>
            <span className="text-[10px] text-muted truncate max-w-[120px]">
              {user?.email || "admin@creatorpulse.ai"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-800/40 transition-colors ml-1"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
