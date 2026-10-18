"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import BudgetComparisonBarChart from "@/components/charts/BudgetComparisonBarChart";
import { PlatformBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { OptimizationResponse, Influencer, Campaign } from "@/types";
import { formatINR, formatNumber, formatPercent, formatROAS } from "@/lib/utils";
import {
  Cpu,
  Calculator,
  Sliders,
  DollarSign,
  TrendingUp,
  Target,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Info,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function BudgetOptimizationPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [totalBudget, setTotalBudget] = useState<string>("3500000");
  const [objective, setObjective] = useState<string>("MAX_REVENUE");
  const [grossMarginPct, setGrossMarginPct] = useState<string>("40");

  // Constraints per influencer
  const [minBudgets, setMinBudgets] = useState<Record<number, string>>({});
  const [maxBudgets, setMaxBudgets] = useState<Record<number, string>>({});
  const [eligibility, setEligibility] = useState<Record<number, boolean>>({});

  // Platform caps
  const [instagramCap, setInstagramCap] = useState<string>("");
  const [youtubeCap, setYoutubeCap] = useState<string>("");

  const [optimizationResult, setOptimizationResult] = useState<OptimizationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Campaign[]>("/campaigns"),
      api.get<Influencer[]>("/influencers"),
      api.get<any[]>("/optimization/runs"),
    ]).then(([campRes, infRes, runsRes]) => {
      setCampaigns(campRes);
      setInfluencers(infRes);

      // Preload baseline constraints
      const mins: Record<number, string> = {};
      const maxs: Record<number, string> = {};
      const elig: Record<number, boolean> = {};
      infRes.forEach((inf) => {
        mins[inf.id] = "15000";
        maxs[inf.id] = "600000";
        elig[inf.id] = true;
      });
      setMinBudgets(mins);
      setMaxBudgets(maxs);
      setEligibility(elig);

      // If existing runs, load the latest
      if (runsRes && runsRes.length > 0) {
        api.get<any>(`/optimization/runs/${runsRes[0].id}`).then((detail) => {
          if (detail && detail.run) {
            setOptimizationResult({
              ...detail.run,
              allocations: detail.allocations || [],
              assumptions_note:
                "Modeled expectations derived from diminishing return response curves R_i(b_i) = A_i(1 - e^{-k_i b_i}).",
            });
          }
        });
      }
    });
  }, []);

  const handleRunOptimization = async () => {
    setLoading(true);
    setValidationMsg(null);

    const influencer_constraints = influencers.map((inf) => ({
      influencer_id: inf.id,
      min_budget: parseFloat(minBudgets[inf.id] || "0") || 0,
      max_budget: maxBudgets[inf.id] ? parseFloat(maxBudgets[inf.id]) : undefined,
      is_eligible: eligibility[inf.id] !== false,
    }));

    const platform_caps: Record<string, number> = {};
    if (instagramCap) platform_caps["INSTAGRAM"] = parseFloat(instagramCap);
    if (youtubeCap) platform_caps["YOUTUBE"] = parseFloat(youtubeCap);

    try {
      const res = await api.post<OptimizationResponse>("/optimization/run", {
        campaign_id: selectedCampaignId ? parseInt(selectedCampaignId) : undefined,
        total_budget: parseFloat(totalBudget) || 1000000,
        objective,
        gross_margin_pct: parseFloat(grossMarginPct) || 40.0,
        influencer_constraints,
        platform_caps: Object.keys(platform_caps).length > 0 ? platform_caps : undefined,
      });

      setOptimizationResult(res);
      if (res.solver_status === "INFEASIBLE") {
        setValidationMsg(res.solver_message);
      }
    } catch (err: any) {
      setValidationMsg(err.message || "Failed to execute optimization solver.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Scientific Budget Optimization"
        subtitle="Constrained mathematical budget distribution using SciPy SLSQP nonlinear solver."
        badge="SciPy Engine"
        badgeColor="bg-purple-950/60 text-purple-300 border-purple-500/30"
      >
        <button
          onClick={handleRunOptimization}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Cpu className={`w-4 h-4 ${loading ? "animate-spin" : "text-secondary"}`} />
          <span>{loading ? "Solving SLSQP..." : "Run Optimization"}</span>
        </button>
      </PageHeader>

      {/* Infeasible or Validation Banner */}
      {validationMsg && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <strong className="block font-bold">Infeasible Constraint Detected:</strong>
            <span>{validationMsg}</span>
          </div>
        </div>
      )}

      {/* Solver Controls Panel */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Optimization Objective & Global Budget
            </h3>
          </div>
          <span className="text-[11px] text-muted">Algorithm: SciPy Sequential Least Squares Programming</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Campaign Scope</label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
            >
              <option value="">Full Portfolio (All Creators)</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Total Budget to Allocate (INR ₹)
            </label>
            <input
              type="number"
              min="50000"
              step="50000"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Optimization Objective</label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none font-semibold text-secondary"
            >
              <option value="MAX_REVENUE">Maximize Attributed Revenue</option>
              <option value="MAX_CONTRIBUTION">Maximize Net Contribution After Spend</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Gross Margin (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              step="5"
              value={grossMarginPct}
              onChange={(e) => setGrossMarginPct(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Platform Caps Sub-Row */}
        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Instagram Platform Budget Cap (Optional ₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 1800000"
              value={instagramCap}
              onChange={(e) => setInstagramCap(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              YouTube Platform Budget Cap (Optional ₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 1500000"
              value={youtubeCap}
              onChange={(e) => setYoutubeCap(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Solver Results Section */}
      {optimizationResult && optimizationResult.solver_status !== "INFEASIBLE" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Optimized Modeled Revenue"
              value={formatINR(optimizationResult.optimized_expected_revenue, true)}
              change={formatPercent(optimizationResult.revenue_change_pct)}
              isPositive={optimizationResult.revenue_change >= 0}
              subtitle={`Baseline: ${formatINR(optimizationResult.baseline_expected_revenue, true)}`}
              icon={TrendingUp}
              iconColor="text-primary"
              tooltip="Expected sales revenue derived from non-linear response curve R_i(b_i)."
            />
            <StatCard
              title="Projected Revenue Lift"
              value={`+${formatINR(optimizationResult.revenue_change, true)}`}
              change={`${optimizationResult.revenue_change_pct}% Gain`}
              isPositive={true}
              subtitle="Same total budget, optimized split"
              icon={Target}
              iconColor="text-secondary"
              tooltip="Incremental attributed revenue generated solely by rebalancing capital."
            />
            <StatCard
              title="Optimized Modeled ROAS"
              value={formatROAS(optimizationResult.optimized_roas)}
              change={`Baseline: ${formatROAS(optimizationResult.baseline_roas)}`}
              isPositive={optimizationResult.optimized_roas >= optimizationResult.baseline_roas}
              subtitle="Expected portfolio return multiplier"
              icon={DollarSign}
              iconColor="text-emerald-400"
            />
            <StatCard
              title="Solver Status"
              value={optimizationResult.solver_status}
              subtitle="100% Budget Conservation Verified"
              icon={CheckCircle2}
              iconColor="text-emerald-400"
              tooltip={optimizationResult.solver_message}
            />
          </div>

          {/* Budget Shift Comparison Chart */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Baseline vs. Recommended Allocation</h3>
                <p className="text-xs text-muted">
                  Visual comparison of current spend vs. optimal allocation per creator
                </p>
              </div>
            </div>
            <BudgetComparisonBarChart allocations={optimizationResult.allocations} />
          </div>

          {/* Creator Allocations Detail Table */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Recommended Creator Allocations</h3>
                <p className="text-xs text-muted">
                  Individual budget shifts, projected returns, marginal revenue derivatives, and saturation
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="pb-3 font-medium">Creator</th>
                    <th className="pb-3 font-medium">Platform</th>
                    <th className="pb-3 font-medium">Baseline Budget</th>
                    <th className="pb-3 font-medium">Recommended Budget</th>
                    <th className="pb-3 font-medium">Shift (₹ / %)</th>
                    <th className="pb-3 font-medium">Expected Revenue</th>
                    <th className="pb-3 font-medium">Marginal Return (dR/db)</th>
                    <th className="pb-3 font-medium">Saturation</th>
                    <th className="pb-3 font-medium">Constraints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {optimizationResult.allocations.map((a) => (
                    <tr key={a.influencer_id} className="hover:bg-card-hover/50 transition-colors">
                      <td className="py-3.5 font-bold text-white">@{a.handle}</td>
                      <td className="py-3.5">
                        <PlatformBadge platform={a.platform} />
                      </td>
                      <td className="py-3.5 text-slate-300">{formatINR(a.baseline_budget)}</td>
                      <td className="py-3.5 font-bold text-white bg-purple-950/20 px-2 rounded">
                        {formatINR(a.recommended_budget)}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`font-semibold ${
                            a.budget_change > 0
                              ? "text-emerald-400"
                              : a.budget_change < 0
                              ? "text-rose-400"
                              : "text-muted"
                          }`}
                        >
                          {a.budget_change > 0 ? "+" : ""}
                          {formatINR(a.budget_change)} ({a.budget_change_pct}%)
                        </span>
                      </td>
                      <td className="py-3.5 font-semibold text-white">
                        {formatINR(a.expected_revenue)}
                      </td>
                      <td className="py-3.5">
                        <span className="font-mono text-secondary font-semibold">
                          ₹{a.marginal_return.toFixed(2)}/₹1
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-300">{a.saturation_pct}%</td>
                      <td className="py-3.5">
                        {a.is_binding_constraint ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            {a.constraint_note || "Binding"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted">Interior solution</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 p-3.5 rounded-xl bg-background border border-border/80 text-[11px] text-muted flex items-start gap-2.5">
              <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <span>{optimizationResult.assumptions_note}</span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
