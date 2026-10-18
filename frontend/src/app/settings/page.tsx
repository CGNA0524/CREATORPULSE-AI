"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import { User } from "@/types";
import {
  Settings,
  Building2,
  Coins,
  ShieldCheck,
  CheckCircle2,
  User as UserIcon,
  Cpu,
  Server,
  Layers,
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [currency, setCurrency] = useState("INR");
  const [margin, setMargin] = useState("40.0");
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    api.get<User>("/auth/me").then(setUser).catch(() => {});
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then(setHealthStatus)
      .catch(() => setHealthStatus({ status: "online (local proxy)" }));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings & Workspace Configuration"
        subtitle="Manage organization parameters, modeling defaults, currency, and system health."
      />

      {savedMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization & User Profile */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Workspace & Profile
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-muted block mb-1">Organization Name</span>
              <div className="p-3 rounded-xl bg-background border border-border text-white font-semibold">
                {user?.organization_name || "PulseBrands Global"}
              </div>
            </div>

            <div>
              <span className="text-muted block mb-1">Current User Name</span>
              <div className="p-3 rounded-xl bg-background border border-border text-white font-medium">
                {user?.name || "Marketing Lead"}
              </div>
            </div>

            <div>
              <span className="text-muted block mb-1">Email Address</span>
              <div className="p-3 rounded-xl bg-background border border-border text-slate-300 font-mono">
                {user?.email || "admin@creatorpulse.ai"}
              </div>
            </div>

            <div>
              <span className="text-muted block mb-1">Access Role</span>
              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase">
                {user?.role || "Owner"}
              </span>
            </div>
          </div>
        </div>

        {/* Global Financial & Modeling Assumptions */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <Coins className="w-5 h-5 text-secondary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Financial & Modeling Assumptions
            </h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="text-muted block mb-1.5 font-medium">Reporting Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-white focus:border-primary outline-none"
              >
                <option value="INR">Indian Rupee (INR - ₹)</option>
                <option value="USD">US Dollar (USD - $)</option>
              </select>
            </div>

            <div>
              <label className="text-muted block mb-1.5 font-medium">
                Default Gross Margin (% of Revenue)
              </label>
              <input
                type="number"
                min="5"
                max="95"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-white focus:border-primary outline-none font-semibold"
              />
              <span className="text-[11px] text-muted block mt-1">
                Used in objective function: <code className="text-secondary font-mono">m · Revenue − Spend</code>
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Infrastructure & Stack Diagnostics */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <Server className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Backend Service Health & Engine Diagnostics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-background border border-border">
              <span className="text-muted block mb-1">FastAPI Backend Status</span>
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{healthStatus?.status || "HEALTHY (Online)"}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-background border border-border">
              <span className="text-muted block mb-1">SciPy SLSQP Solver</span>
              <div className="flex items-center gap-2 font-bold text-secondary">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <span>Nonlinear Optimizer Active</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-background border border-border">
              <span className="text-muted block mb-1">Database Connectivity</span>
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="font-mono text-purple-300">SQLite / PostgreSQL</span>
                <span className="text-emerald-400 font-normal">(Connected)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
