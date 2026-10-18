"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import {
  FileSpreadsheet,
  Download,
  Cpu,
  TrendingUp,
  Target,
  BrainCircuit,
  CheckCircle2,
  Info,
  Layers,
} from "lucide-react";

export default function ReportsPage() {
  const [benchmark, setBenchmark] = useState<any>(null);
  const [loadingBenchmark, setLoadingBenchmark] = useState(true);
  const [targetMetric, setTargetMetric] = useState("attributed_revenue");

  const fetchBenchmark = async (target: string) => {
    try {
      setLoadingBenchmark(true);
      const res = await api.get<any>("/predictive/benchmark", { target });
      setBenchmark(res?.benchmark || null);
    } catch (err) {
      console.error("Failed to load benchmark:", err);
    } finally {
      setLoadingBenchmark(false);
    }
  };

  useEffect(() => {
    fetchBenchmark(targetMetric);
  }, [targetMetric]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports & Predictive Intelligence"
        subtitle="Downloadable business audits, CSV data dumps, and machine learning model validation."
      />

      {/* CSV Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <div className="p-3 w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Campaign Performance Export</h3>
            <p className="text-xs text-muted leading-relaxed mb-6">
              Complete audit of all campaigns, allocated budgets, actual spend, attributed sales revenue, ROAS, conversions, and status.
            </p>
          </div>
          <a
            href="http://localhost:8000/api/v1/reports/campaigns/export"
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-background hover:bg-card-hover border border-border text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-secondary" />
            <span>Download Campaigns CSV</span>
          </a>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <div className="p-3 w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Influencer ROI Export</h3>
            <p className="text-xs text-muted leading-relaxed mb-6">
              Creator roster performance breakdown with follower counts, audience quality ratings, spend efficiency, CPA, and conversion rates.
            </p>
          </div>
          <a
            href="http://localhost:8000/api/v1/reports/influencers/export"
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-background hover:bg-card-hover border border-border text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-secondary" />
            <span>Download Influencers CSV</span>
          </a>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <div className="p-3 w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">SciPy Optimization Export</h3>
            <p className="text-xs text-muted leading-relaxed mb-6">
              Full breakdown of latest SLSQP solver recommendations, baseline vs. recommended budget shifts, projected revenue, and marginal returns.
            </p>
          </div>
          <a
            href="http://localhost:8000/api/v1/reports/optimization/export"
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-background hover:bg-card-hover border border-border text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-secondary" />
            <span>Download Allocations CSV</span>
          </a>
        </div>
      </div>

      {/* Machine Learning Predictive Analytics Benchmark Section */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit className="w-5 h-5 text-secondary" />
              <h3 className="text-base font-bold text-white">
                Machine Learning Predictive Regression Benchmarks
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                scikit-learn Verified
              </span>
            </div>
            <p className="text-xs text-muted">
              Models trained on chronological performance observations and evaluated against a DummyRegressor baseline on held-out test data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">Target:</span>
            <select
              value={targetMetric}
              onChange={(e) => setTargetMetric(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
            >
              <option value="attributed_revenue">Attributed Revenue</option>
              <option value="conversions">Conversions</option>
              <option value="clicks">Clicks</option>
            </select>
          </div>
        </div>

        {loadingBenchmark ? (
          <div className="py-12 text-center text-xs text-muted">Training candidate models...</div>
        ) : benchmark ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Best Performing Model"
                value={benchmark.best_model_name}
                subtitle={`Outperformed ${benchmark.baseline_model}`}
                icon={BrainCircuit}
                iconColor="text-secondary"
              />
              <StatCard
                title="Mean Absolute Error (MAE)"
                value={formatINR(benchmark.model_mae)}
                subtitle={`Baseline Dummy MAE: ${formatINR(benchmark.baseline_mae)}`}
                isPositive={benchmark.model_mae < benchmark.baseline_mae}
                icon={TrendingUp}
                iconColor="text-primary"
              />
              <StatCard
                title="Root Mean Squared Error"
                value={formatINR(benchmark.model_rmse)}
                subtitle={`Baseline RMSE: ${formatINR(benchmark.baseline_rmse)}`}
                icon={Target}
                iconColor="text-purple-400"
              />
              <StatCard
                title="Out-of-Sample R² Score"
                value={`${benchmark.model_r2}`}
                subtitle={`Trained on ${benchmark.data_points} observations`}
                icon={CheckCircle2}
                iconColor="text-emerald-400"
              />
            </div>

            {/* Model Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="pb-3 font-medium">Algorithm</th>
                    <th className="pb-3 font-medium">MAE</th>
                    <th className="pb-3 font-medium">RMSE</th>
                    <th className="pb-3 font-medium">R² Score</th>
                    <th className="pb-3 font-medium">Performance vs Baseline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr className="hover:bg-card-hover/50 text-muted">
                    <td className="py-3 font-medium">Dummy Regressor (Mean baseline)</td>
                    <td className="py-3 font-mono">{formatINR(benchmark.baseline_mae)}</td>
                    <td className="py-3 font-mono">{formatINR(benchmark.baseline_rmse)}</td>
                    <td className="py-3 font-mono">0.00</td>
                    <td className="py-3">Baseline reference point</td>
                  </tr>
                  {benchmark.all_models &&
                    Object.entries(benchmark.all_models).map(([mName, evalMetrics]: [string, any]) => (
                      <tr key={mName} className="hover:bg-card-hover/50">
                        <td className="py-3 font-bold text-white flex items-center gap-1.5">
                          <span>{mName}</span>
                          {mName === benchmark.best_model_name && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-secondary/20 text-secondary border border-secondary/30">
                              Best
                            </span>
                          )}
                        </td>
                        <td className="py-3 font-mono text-slate-200">{formatINR(evalMetrics.mae)}</td>
                        <td className="py-3 font-mono text-slate-200">{formatINR(evalMetrics.rmse)}</td>
                        <td className="py-3 font-mono font-semibold text-secondary">{evalMetrics.r2}</td>
                        <td className="py-3 text-emerald-400 font-semibold">
                          +{(((benchmark.baseline_mae - evalMetrics.mae) / benchmark.baseline_mae) * 100).toFixed(1)}% Error Reduction
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border/80 text-[11px] text-muted flex items-start gap-2.5">
              <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <span>{benchmark.note} Target leakage prevented by evaluating exclusively on held-out test splits.</span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted">
            Insufficient performance observations to benchmark predictive models.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
