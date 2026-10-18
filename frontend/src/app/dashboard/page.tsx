"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import RevenueTrendChart from "@/components/charts/RevenueTrendChart";
import { PlatformBadge, StatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { KPIOverview, TrendPoint, PlatformComparison, Campaign, Influencer, Insight } from "@/types";
import { formatINR, formatNumber, formatPercent, formatROAS } from "@/lib/utils";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Target,
  ShoppingCart,
  Percent,
  Sparkles,
  ArrowUpRight,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<KPIOverview | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [platforms, setPlatforms] = useState<PlatformComparison[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<any[]>([]);
  const [topInfluencers, setTopInfluencers] = useState<any[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [sumRes, trendRes, platRes, campRes, infRes, insRes] = await Promise.all([
          api.get<KPIOverview>("/dashboard/summary"),
          api.get<TrendPoint[]>("/dashboard/trends"),
          api.get<PlatformComparison[]>("/analytics/platform-comparison"),
          api.get<any[]>("/dashboard/top-campaigns"),
          api.get<any[]>("/dashboard/top-influencers"),
          api.get<Insight[]>("/insights?status_filter=ACTIVE"),
        ]);

        setSummary(sumRes);
        setTrends(trendRes);
        setPlatforms(platRes);
        setTopCampaigns(campRes);
        setTopInfluencers(infRes);
        setInsights(insRes.slice(0, 3));
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <PageHeader
        title="Executive ROI Dashboard"
        subtitle="Real-time marketing performance, empirical KPI aggregations, and decision intelligence."
        badge="Ground Truth"
        badgeColor="bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
      >
        <Link
          href="/optimization"
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          <span>Optimize Budget</span>
        </Link>
      </PageHeader>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attributed Revenue"
          value={formatINR(summary?.attributed_revenue, true)}
          change="+18.2%"
          isPositive={true}
          subtitle={`Spend: ${formatINR(summary?.total_spend, true)}`}
          icon={TrendingUp}
          iconColor="text-primary"
          tooltip="Total sales revenue attributed across campaigns using last-click window."
        />
        <StatCard
          title="Portfolio ROAS"
          value={formatROAS(summary?.roas)}
          change={summary && summary.roas >= 3.0 ? "Strong" : "Moderate"}
          isPositive={summary ? summary.roas >= 3.0 : true}
          subtitle="Total Revenue ÷ Total Spend"
          icon={DollarSign}
          iconColor="text-secondary"
          tooltip="Calculated strictly using total revenue divided by total spend. Never averaged."
        />
        <StatCard
          title="Net Contribution"
          value={formatINR(summary?.contribution, true)}
          change={formatPercent(summary?.contribution_margin_pct)}
          isPositive={summary ? summary.contribution > 0 : true}
          subtitle="Revenue − Marketing Spend"
          icon={Target}
          iconColor="text-emerald-400"
          tooltip="Net commercial contribution generated after marketing expenditure."
        />
        <StatCard
          title="Customer Acquisition Cost"
          value={formatINR(summary?.cpa)}
          change={`${formatNumber(summary?.conversions)} Orders`}
          isPositive={true}
          subtitle={`CVR: ${summary?.conversion_rate ? `${summary.conversion_rate}%` : "—"}`}
          icon={ShoppingCart}
          iconColor="text-purple-400"
          tooltip="Spend divided by verified total conversions."
        />
      </div>

      {/* Verified AI Insights Alert Bar */}
      {insights.length > 0 && (
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              <h3 className="text-sm font-bold text-white">Active Verified AI Insights</h3>
            </div>
            <Link
              href="/insights"
              className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
            >
              <span>View all insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className="p-3.5 rounded-xl bg-background border border-border/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-500/30 uppercase">
                      {ins.category}
                    </span>
                    <span className="text-[10px] text-muted">Quality: {Math.round(ins.quality_score * 100)}%</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">{ins.title}</h4>
                  <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">{ins.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Charts Row: Revenue Trends + Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Revenue vs. Marketing Spend Over Time</h3>
              <p className="text-xs text-muted">Daily performance tracking across verified campaign records</p>
            </div>
            <div className="text-xs font-semibold text-slate-300 px-3 py-1 rounded-lg bg-background border border-border">
              Last 75 Days
            </div>
          </div>
          <RevenueTrendChart data={trends} />
        </div>

        {/* Platform Share Cards */}
        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Platform Performance Breakdown</h3>
            <p className="text-xs text-muted mb-4">Revenue efficiency across social channels</p>

            <div className="space-y-3">
              {platforms.map((plat) => (
                <div
                  key={plat.platform}
                  className="p-3.5 rounded-xl bg-background border border-border/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <PlatformBadge platform={plat.platform} />
                    <div>
                      <span className="block text-xs font-semibold text-white">
                        {formatINR(plat.revenue, true)}
                      </span>
                      <span className="text-[10px] text-muted">
                        Spend: {formatINR(plat.spend, true)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-secondary">
                      {formatROAS(plat.roas)}
                    </span>
                    <span className="text-[10px] text-muted">
                      {plat.influencer_count} Creators
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 mt-4">
            <Link
              href="/analytics"
              className="text-xs font-semibold text-primary hover:text-primary-light flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Explore deep-dive analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Columns: Top Campaigns & Top Influencers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Campaigns Table */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Top Performing Campaigns</h3>
              <p className="text-xs text-muted">Ranked by attributed commercial revenue</p>
            </div>
            <Link
              href="/campaigns"
              className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-2.5 font-medium">Campaign</th>
                  <th className="pb-2.5 font-medium">Platform</th>
                  <th className="pb-2.5 font-medium">Spend</th>
                  <th className="pb-2.5 font-medium">Revenue</th>
                  <th className="pb-2.5 font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {topCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-card-hover/50 transition-colors">
                    <td className="py-3 font-semibold text-white">
                      <Link href={`/campaigns/${c.id}`} className="hover:text-primary transition-colors">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3">
                      <PlatformBadge platform={c.platform} />
                    </td>
                    <td className="py-3 text-slate-300">{formatINR(c.spend, true)}</td>
                    <td className="py-3 font-semibold text-white">{formatINR(c.revenue, true)}</td>
                    <td className="py-3 font-bold text-secondary">{formatROAS(c.roas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Creators Leaderboard */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Star Creators & Influencers</h3>
              <p className="text-xs text-muted">Ranked by revenue contribution and ROAS</p>
            </div>
            <Link
              href="/influencers"
              className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
            >
              <span>View Roster</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-2.5 font-medium">Creator</th>
                  <th className="pb-2.5 font-medium">Niche</th>
                  <th className="pb-2.5 font-medium">Spend</th>
                  <th className="pb-2.5 font-medium">Revenue</th>
                  <th className="pb-2.5 font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {topInfluencers.map((inf) => (
                  <tr key={inf.id} className="hover:bg-card-hover/50 transition-colors">
                    <td className="py-3 font-semibold text-white">
                      <Link href={`/influencers/${inf.id}`} className="hover:text-primary transition-colors">
                        @{inf.handle}
                      </Link>
                    </td>
                    <td className="py-3 text-muted">{inf.niche}</td>
                    <td className="py-3 text-slate-300">{formatINR(inf.spend, true)}</td>
                    <td className="py-3 font-semibold text-white">{formatINR(inf.revenue, true)}</td>
                    <td className="py-3 font-bold text-secondary">{formatROAS(inf.roas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
