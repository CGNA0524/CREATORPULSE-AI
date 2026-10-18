"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import { Insight } from "@/types";
import { formatINR } from "@/lib/utils";
import {
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Sliders,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
} from "lucide-react";

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter) params.category_filter = categoryFilter;
      const res = await api.get<Insight[]>("/insights", params);
      setInsights(res);
    } catch (err) {
      console.error("Failed to load insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [categoryFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const refreshed = await api.post<Insight[]>("/insights/generate");
      setInsights(refreshed);
    } catch (err: any) {
      alert(err.message || "Failed to generate insights");
    } finally {
      setRefreshing(false);
    }
  };

  const handleReview = async (id: number) => {
    try {
      await api.post(`/insights/${id}/review`);
      setInsights(insights.map((ins) => (ins.id === id ? { ...ins, status: "REVIEWED" } : ins)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await api.post(`/insights/${id}/dismiss`);
      setInsights(insights.filter((ins) => ins.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "PERFORMANCE":
        return <TrendingUp className="w-5 h-5 text-primary" />;
      case "RISK":
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case "BUDGET":
        return <Sliders className="w-5 h-5 text-secondary" />;
      case "OPPORTUNITY":
        return <Lightbulb className="w-5 h-5 text-emerald-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "PERFORMANCE":
        return "bg-purple-950/60 text-purple-300 border-purple-500/30";
      case "RISK":
        return "bg-rose-950/60 text-rose-300 border-rose-500/30";
      case "BUDGET":
        return "bg-cyan-950/60 text-cyan-300 border-cyan-500/30";
      case "OPPORTUNITY":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="AI Insights Hub"
        subtitle="Empirical decision intelligence and evidence-grounded marketing recommendations."
        badge="Zero Hallucinations"
        badgeColor="bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
      >
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Analyzing Evidence..." : "Regenerate Insights"}</span>
        </button>
      </PageHeader>

      {/* Category Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategoryFilter("")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            categoryFilter === ""
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-card text-muted border-border hover:text-white"
          }`}
        >
          All Categories ({insights.length})
        </button>
        {["PERFORMANCE", "OPPORTUNITY", "BUDGET", "RISK"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              categoryFilter === cat
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-card text-muted border-border hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="p-6 rounded-2xl bg-card border border-border hover:border-border-light transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-background border border-border">
                    {getCategoryIcon(ins.category)}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getCategoryBadge(ins.category)}`}>
                    {ins.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted">
                    Quality Rating: <strong>{Math.round(ins.quality_score * 100)}%</strong>
                  </span>
                  {ins.status === "REVIEWED" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                      Reviewed
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-2">{ins.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{ins.explanation}</p>

              {/* Structured Evidence Payload */}
              {ins.evidence_json && Object.keys(ins.evidence_json).length > 0 && (
                <div className="p-3.5 rounded-xl bg-background border border-border/80 mb-4">
                  <span className="text-[10px] font-bold text-muted uppercase block mb-2">
                    Verified Empirical Evidence
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.entries(ins.evidence_json).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-[10px] text-muted block capitalize truncate">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <strong className="text-slate-200 font-mono text-[11px]">
                          {typeof value === "number" && key.includes("spend") || key.includes("revenue")
                            ? formatINR(value)
                            : String(value)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ins.recommended_action && (
                <div className="p-3 rounded-xl bg-purple-950/20 border border-primary/20 text-xs text-purple-200 mb-4 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[11px] font-bold text-white mb-0.5">
                      Recommended Strategic Action:
                    </strong>
                    <span>{ins.recommended_action}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-[11px] text-muted">
                Observed on {new Date(ins.created_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                {ins.status !== "REVIEWED" && (
                  <button
                    onClick={() => handleReview(ins.id)}
                    className="px-3 py-1.5 rounded-lg bg-background hover:bg-card border border-border text-slate-300 hover:text-white transition-colors"
                  >
                    Mark Reviewed
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(ins.id)}
                  className="px-3 py-1.5 rounded-lg bg-background hover:bg-rose-950/30 border border-border text-muted hover:text-rose-400 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
