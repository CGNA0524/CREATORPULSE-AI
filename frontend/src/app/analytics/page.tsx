"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { PlatformBadge, StatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { KPIOverview, PlatformComparison, Campaign } from "@/types";
import { formatINR, formatNumber, formatPercent, formatROAS } from "@/lib/utils";
import Link from "next/link";
import {
  LineChart,
  Filter,
  DollarSign,
  TrendingUp,
  Target,
  ShoppingCart,
  Eye,
  MousePointer,
  CheckCircle,
  ArrowRight,
  Download,
} from "lucide-react";

export default function AnalyticsExplorerPage() {
  const [overview, setOverview] = useState<KPIOverview | null>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [campaignComparison, setCampaignComparison] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<PlatformComparison[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCampaign) params.campaign_id = parseInt(selectedCampaign);
      if (selectedPlatform) params.platform = selectedPlatform;

      const [ovRes, funRes, compRes, platRes] = await Promise.all([
        api.get<KPIOverview>("/analytics/overview", params),
        api.get<any>("/analytics/funnel", params),
        api.get<any[]>("/analytics/campaign-comparison"),
        api.get<PlatformComparison[]>("/analytics/platform-comparison", params),
      ]);

      setOverview(ovRes);
      setFunnel(funRes);
      setCampaignComparison(compRes);
      setPlatforms(platRes);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get<Campaign[]>("/campaigns").then(setCampaigns).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedCampaign, selectedPlatform]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Analytics Explorer"
        subtitle="Multi-dimensional marketing performance, conversion funnels, and channel comparisons."
      >
        <a
          href="http://localhost:8000/api/v1/reports/campaigns/export"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2.5 rounded-xl bg-card hover:bg-card-hover border border-border hover:border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-4 h-4 text-secondary" />
          <span>Export Summary CSV</span>
        </a>
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Filter className="w-4 h-4 text-primary" />
          <span className="font-semibold text-slate-300">Active Query Scope:</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-background border border-border text-xs text-slate-300 focus:border-primary outline-none"
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-background border border-border text-xs text-slate-300 focus:border-primary outline-none"
          >
            <option value="">All Channels</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="TIKTOK">TikTok</option>
          </select>
        </div>
      </div>

      {/* Core KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attributed Revenue"
          value={formatINR(overview?.attributed_revenue, true)}
          subtitle={`Spend: ${formatINR(overview?.total_spend, true)}`}
          icon={TrendingUp}
          iconColor="text-primary"
        />
        <StatCard
          title="Portfolio ROAS"
          value={formatROAS(overview?.roas)}
          isPositive={overview ? overview.roas >= 3.0 : true}
          subtitle="Revenue ÷ Spend"
          icon={DollarSign}
          iconColor="text-secondary"
        />
        <StatCard
          title="Cost Per Click (CPC)"
          value={formatINR(overview?.cpc)}
          subtitle={`${formatNumber(overview?.total_clicks)} Total Clicks`}
          icon={MousePointer}
          iconColor="text-purple-400"
        />
        <StatCard
          title="Cost Per Thousand (CPM)"
          value={formatINR(overview?.cpm)}
          subtitle={`${formatNumber(overview?.total_impressions)} Impressions`}
          icon={Eye}
          iconColor="text-emerald-400"
        />
      </div>

      {/* Full Marketing Funnel Visualizer */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="mb-6">
          <h3 className="text-base font-bold text-white">Full-Funnel Conversion Mechanics</h3>
          <p className="text-xs text-muted">
            Tracking audience progression from awareness (impressions) to revenue conversion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-background border border-border/80 text-center relative">
            <span className="text-[10px] text-muted block uppercase font-medium">1. Impressions</span>
            <span className="text-lg font-bold text-white block my-1">
              {formatNumber(funnel?.impressions)}
            </span>
            <span className="text-[11px] text-slate-400">Total views</span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border/80 text-center relative">
            <span className="text-[10px] text-muted block uppercase font-medium">2. Unique Reach</span>
            <span className="text-lg font-bold text-white block my-1">
              {formatNumber(funnel?.reach)}
            </span>
            <span className="text-[11px] text-purple-400 font-semibold">
              {funnel?.impressions > 0
                ? `${((funnel.reach / funnel.impressions) * 100).toFixed(1)}% audience`
                : "—"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border/80 text-center relative">
            <span className="text-[10px] text-muted block uppercase font-medium">3. Engagements</span>
            <span className="text-lg font-bold text-white block my-1">
              {formatNumber(funnel?.engagements)}
            </span>
            <span className="text-[11px] text-secondary font-semibold">
              {funnel?.engagement_rate_pct ? `${funnel.engagement_rate_pct}% Eng Rate` : "—"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border/80 text-center relative">
            <span className="text-[10px] text-muted block uppercase font-medium">4. Link Clicks</span>
            <span className="text-lg font-bold text-white block my-1">
              {formatNumber(funnel?.clicks)}
            </span>
            <span className="text-[11px] text-amber-400 font-semibold">
              {funnel?.ctr_pct ? `${funnel.ctr_pct}% CTR` : "—"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-secondary/30 text-center relative">
            <span className="text-[10px] text-secondary block uppercase font-bold">5. Conversions</span>
            <span className="text-lg font-bold text-emerald-400 block my-1">
              {formatNumber(funnel?.conversions)}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold">
              {funnel?.click_to_conv_pct ? `${funnel.click_to_conv_pct}% CVR` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Campaign Comparison Table */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Cross-Campaign Performance Matrix</h3>
            <p className="text-xs text-muted">Comparative breakdown of revenue, spend, ROAS, and contribution</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-3 font-medium">Campaign</th>
                <th className="pb-3 font-medium">Platform</th>
                <th className="pb-3 font-medium">Spend</th>
                <th className="pb-3 font-medium">Revenue</th>
                <th className="pb-3 font-medium">Net Contribution</th>
                <th className="pb-3 font-medium">ROAS</th>
                <th className="pb-3 font-medium">Conversions</th>
                <th className="pb-3 font-medium">CPA</th>
                <th className="pb-3 font-medium">CVR%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {campaignComparison.map((c) => (
                <tr key={c.campaign_id} className="hover:bg-card-hover/50 transition-colors">
                  <td className="py-3.5 font-bold text-white">
                    <Link href={`/campaigns/${c.campaign_id}`} className="hover:text-primary transition-colors">
                      {c.campaign_name}
                    </Link>
                  </td>
                  <td className="py-3.5">
                    <PlatformBadge platform={c.platform} />
                  </td>
                  <td className="py-3.5 text-slate-300">{formatINR(c.total_spend, true)}</td>
                  <td className="py-3.5 font-semibold text-white">{formatINR(c.attributed_revenue, true)}</td>
                  <td className="py-3.5 font-semibold text-emerald-400">{formatINR(c.contribution, true)}</td>
                  <td className="py-3.5 font-bold text-secondary">{formatROAS(c.roas)}</td>
                  <td className="py-3.5 font-medium text-white">{formatNumber(c.conversions)}</td>
                  <td className="py-3.5 text-slate-300">{formatINR(c.cpa)}</td>
                  <td className="py-3.5 text-slate-300">
                    {c.conversion_rate ? `${c.conversion_rate}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
