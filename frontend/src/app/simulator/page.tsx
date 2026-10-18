"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import BudgetComparisonBarChart from "@/components/charts/BudgetComparisonBarChart";
import { PlatformBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Scenario, Influencer, OptimizationResponse } from "@/types";
import { formatINR, formatNumber, formatPercent, formatROAS } from "@/lib/utils";
import {
  Sliders,
  Play,
  BookmarkPlus,
  RefreshCw,
  GitCompare,
  TrendingUp,
  DollarSign,
  Target,
  ShieldCheck,
  CheckCircle,
  X,
  Trash2,
} from "lucide-react";

export default function SimulatorPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(3500000);
  const [objective, setObjective] = useState<string>("MAX_REVENUE");
  const [grossMarginPct, setGrossMarginPct] = useState<number>(40);
  const [instagramCap, setInstagramCap] = useState<number>(1800000);
  const [simulationResult, setSimulationResult] = useState<OptimizationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Save Modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDesc, setScenarioDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // Compare Modal
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [comparisonResults, setComparisonResults] = useState<any[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const fetchScenarios = async () => {
    try {
      const list = await api.get<Scenario[]>("/scenarios");
      setSavedScenarios(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    api.get<Influencer[]>("/influencers").then(setInfluencers).catch(() => {});
    fetchScenarios();
    handleRunSimulation();
  }, []);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const caps: Record<string, number> = {};
      if (instagramCap > 0) caps["INSTAGRAM"] = instagramCap;

      const res = await api.post<OptimizationResponse>("/scenarios/simulate", {
        total_budget: totalBudget,
        objective,
        gross_margin_pct: grossMarginPct,
        platform_caps: Object.keys(caps).length > 0 ? caps : undefined,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulationResult) return;
    setSaving(true);
    try {
      await api.post("/scenarios", {
        name: scenarioName,
        description: scenarioDesc,
        assumptions: {
          total_budget: totalBudget,
          objective,
          gross_margin_pct: grossMarginPct,
          platform_caps: { INSTAGRAM: instagramCap },
        },
        baseline_results: {
          expected_revenue: simulationResult.baseline_expected_revenue,
          roas: simulationResult.baseline_roas,
        },
        scenario_results: {
          expected_revenue: simulationResult.optimized_expected_revenue,
          roas: simulationResult.optimized_roas,
          revenue_gain: simulationResult.revenue_change,
        },
      });
      setIsSaveModalOpen(false);
      setScenarioName("");
      setScenarioDesc("");
      fetchScenarios();
    } catch (err: any) {
      alert(err.message || "Failed to save scenario");
    } finally {
      setSaving(false);
    }
  };

  const handleCompare = async () => {
    if (selectedForCompare.length < 2) {
      alert("Please select at least 2 saved scenarios to compare.");
      return;
    }
    try {
      const comp = await api.post<any[]>("/scenarios/compare", {
        scenario_ids: selectedForCompare,
      });
      setComparisonResults(comp);
      setIsCompareModalOpen(true);
    } catch (err: any) {
      alert(err.message || "Failed to compare scenarios.");
    }
  };

  const handleDeleteScenario = async (id: number) => {
    if (!confirm("Delete this saved scenario?")) return;
    try {
      await api.delete(`/scenarios/${id}`);
      fetchScenarios();
    } catch (err: any) {
      alert(err.message || "Failed to delete scenario");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Interactive What-If Simulator"
        subtitle="Dynamically adjust budget ceilings, response constraints, and platform caps to evaluate trade-offs."
        badge="Real-time Simulator"
        badgeColor="bg-cyan-950/60 text-cyan-300 border-cyan-500/30"
      >
        <div className="flex items-center gap-2">
          {savedScenarios.length >= 2 && (
            <button
              onClick={handleCompare}
              className="px-4 py-2.5 rounded-xl bg-card hover:bg-card-hover border border-border text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <GitCompare className="w-4 h-4 text-secondary" />
              <span>Compare Scenarios ({selectedForCompare.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsSaveModalOpen(true)}
            disabled={!simulationResult}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Save Scenario</span>
          </button>
        </div>
      </PageHeader>

      {/* Simulator Sliders & Parameters */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Simulation Parameters & Bounds
            </h3>
          </div>
          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-secondary/15 hover:bg-secondary/25 border border-secondary/30 text-secondary text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Recalculate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Budget Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Total Portfolio Budget</span>
              <span className="font-bold text-white">{formatINR(totalBudget)}</span>
            </div>
            <input
              type="range"
              min="500000"
              max="10000000"
              step="100000"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>₹5.0 L</span>
              <span>₹1.00 Cr</span>
            </div>
          </div>

          {/* Instagram Platform Cap Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Instagram Budget Cap</span>
              <span className="font-bold text-secondary">{formatINR(instagramCap)}</span>
            </div>
            <input
              type="range"
              min="200000"
              max="5000000"
              step="50000"
              value={instagramCap}
              onChange={(e) => setInstagramCap(Number(e.target.value))}
              className="w-full accent-secondary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>₹2.0 L</span>
              <span>₹50.0 L</span>
            </div>
          </div>

          {/* Gross Margin Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Product Gross Margin</span>
              <span className="font-bold text-emerald-400">{grossMarginPct}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={grossMarginPct}
              onChange={(e) => setGrossMarginPct(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>10%</span>
              <span>90%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Projected Results */}
      {simulationResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Projected Scenario Revenue"
              value={formatINR(simulationResult.optimized_expected_revenue, true)}
              change={formatPercent(simulationResult.revenue_change_pct)}
              isPositive={simulationResult.revenue_change >= 0}
              subtitle={`Baseline: ${formatINR(simulationResult.baseline_expected_revenue, true)}`}
              icon={TrendingUp}
              iconColor="text-primary"
            />
            <StatCard
              title="Projected Scenario ROAS"
              value={formatROAS(simulationResult.optimized_roas)}
              change={`Baseline: ${formatROAS(simulationResult.baseline_roas)}`}
              isPositive={simulationResult.optimized_roas >= simulationResult.baseline_roas}
              subtitle="Expected return efficiency"
              icon={DollarSign}
              iconColor="text-secondary"
            />
            <StatCard
              title="Net Contribution"
              value={formatINR(simulationResult.optimized_expected_contribution, true)}
              change={`+${formatINR(simulationResult.contribution_change, true)}`}
              isPositive={simulationResult.contribution_change >= 0}
              subtitle="After marketing expense"
              icon={Target}
              iconColor="text-emerald-400"
            />
            <StatCard
              title="Budget Allocation Shift"
              value={`₹${(totalBudget / 100000).toFixed(1)} L`}
              subtitle="Conserved across all creators"
              icon={CheckCircle}
              iconColor="text-purple-400"
            />
          </div>

          {/* Allocation Comparison Chart */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Proposed Capital Shifts</h3>
                <p className="text-xs text-muted">Modeled allocations under the simulated assumptions</p>
              </div>
            </div>
            <BudgetComparisonBarChart allocations={simulationResult.allocations} />
          </div>
        </div>
      )}

      {/* Saved Scenarios List */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Saved Scenarios Library</h3>
            <p className="text-xs text-muted">Select scenarios to compare business outcomes</p>
          </div>
        </div>

        {savedScenarios.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted border border-dashed border-border rounded-xl">
            No scenarios saved yet. Run a simulation above and click "Save Scenario".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-3 w-8">Compare</th>
                  <th className="pb-3 font-medium">Scenario Name</th>
                  <th className="pb-3 font-medium">Simulated Budget</th>
                  <th className="pb-3 font-medium">Projected Revenue</th>
                  <th className="pb-3 font-medium">Expected ROAS</th>
                  <th className="pb-3 font-medium">Created Date</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {savedScenarios.map((scen) => {
                  const isChecked = selectedForCompare.includes(scen.id);
                  const assumptions = scen.assumptions_json || {};
                  const results = scen.scenario_results_json || {};

                  return (
                    <tr key={scen.id} className="hover:bg-card-hover/50 transition-colors">
                      <td className="py-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedForCompare([...selectedForCompare, scen.id]);
                            } else {
                              setSelectedForCompare(selectedForCompare.filter((id) => id !== scen.id));
                            }
                          }}
                          className="rounded border-border accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 font-bold text-white">
                        <span>{scen.name}</span>
                        {scen.description && (
                          <span className="block text-[11px] font-normal text-muted truncate max-w-xs">
                            {scen.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-300">
                        {formatINR(assumptions.total_budget, true)}
                      </td>
                      <td className="py-3.5 font-semibold text-white">
                        {formatINR(results.expected_revenue, true)}
                      </td>
                      <td className="py-3.5 font-bold text-secondary">
                        {results.roas ? `${results.roas.toFixed(2)}x` : "—"}
                      </td>
                      <td className="py-3.5 text-muted">
                        {new Date(scen.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteScenario(scen.id)}
                          className="p-1.5 text-muted hover:text-rose-400 rounded transition-colors"
                          title="Delete scenario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Scenario Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Save Simulation Scenario</h2>
            <p className="text-xs text-muted mb-5">
              Archive this configuration to evaluate alternatives or share with leadership.
            </p>

            <form onSubmit={handleSaveScenario} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Scenario Name</label>
                <input
                  type="text"
                  required
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g. Q4 Festive Scaling (+20% Budget)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description / Strategy Notes
                </label>
                <textarea
                  rows={3}
                  value={scenarioDesc}
                  onChange={(e) => setScenarioDesc(e.target.value)}
                  placeholder="Key rationale, platform restrictions, or anticipated market conditions..."
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-background border border-border text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compare Scenarios Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-card border border-border rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Scenario Comparison Matrix</h2>
            <p className="text-xs text-muted mb-6">
              Side-by-side evaluation of selected budget strategies and projected business outcomes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisonResults.map((s) => (
                <div key={s.id} className="p-5 rounded-2xl bg-background border border-border flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase mb-2 inline-block">
                      {s.objective}
                    </span>
                    <h3 className="text-sm font-bold text-white mb-1">{s.name}</h3>
                    {s.description && (
                      <p className="text-xs text-muted mb-4 line-clamp-2">{s.description}</p>
                    )}

                    <div className="space-y-2.5 pt-3 border-t border-border/60 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted">Total Budget:</span>
                        <strong className="text-white">{formatINR(s.total_budget, true)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Projected Revenue:</span>
                        <strong className="text-emerald-400">{formatINR(s.projected_revenue, true)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Projected ROAS:</span>
                        <strong className="text-secondary">{formatROAS(s.projected_roas)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Projected Gain:</span>
                        <strong className="text-purple-300">+{formatINR(s.projected_gain, true)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
