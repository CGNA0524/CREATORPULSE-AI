"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { PlatformBadge, StatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { formatINR, formatNumber, formatROAS } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  ShoppingCart,
  Trash2,
  Sliders,
} from "lucide-react";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;
    api
      .get(`/campaigns/${campaignId}`)
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [campaignId]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;
    try {
      await api.delete(`/campaigns/${campaignId}`);
      router.push("/campaigns");
    } catch (err: any) {
      alert(err.message || "Failed to delete campaign");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-muted">Loading campaign metrics...</div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-muted">Campaign not found.</div>
      </DashboardLayout>
    );
  }

  const { campaign, kpis, influencers } = data;

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/campaigns" className="hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaigns
        </Link>
      </div>

      <PageHeader
        title={campaign.name}
        subtitle={`Objective: ${campaign.objective} • Started: ${campaign.start_date}`}
      >
        <div className="flex items-center gap-3">
          <PlatformBadge platform={campaign.platform} />
          <StatusBadge status={campaign.status} />
          <Link
            href={`/optimization?campaign_id=${campaign.id}`}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-secondary" />
            <span>Optimize Campaign</span>
          </Link>
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl bg-card border border-border text-muted hover:text-rose-400 hover:border-rose-500/40 transition-colors"
            title="Delete campaign"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attributed Revenue"
          value={formatINR(kpis.attributed_revenue, true)}
          subtitle={`Spend: ${formatINR(kpis.total_spend, true)}`}
          icon={TrendingUp}
          iconColor="text-primary"
        />
        <StatCard
          title="Campaign ROAS"
          value={formatROAS(kpis.roas)}
          isPositive={kpis.roas >= 3.0}
          subtitle="Revenue ÷ Spend"
          icon={DollarSign}
          iconColor="text-secondary"
        />
        <StatCard
          title="Net Contribution"
          value={formatINR(kpis.contribution, true)}
          isPositive={kpis.contribution > 0}
          subtitle={`Margin: ${kpis.contribution_margin_pct ? `${kpis.contribution_margin_pct}%` : "—"}`}
          icon={Target}
          iconColor="text-emerald-400"
        />
        <StatCard
          title="Cost Per Acquisition"
          value={formatINR(kpis.cpa)}
          subtitle={`${formatNumber(kpis.conversions)} Conversions`}
          icon={ShoppingCart}
          iconColor="text-purple-400"
        />
      </div>

      {/* Creators in this Campaign Table */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Influencer Roster & Performance</h3>
            <p className="text-xs text-muted">Performance breakdown for each creator in this campaign</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2.5 font-medium">Influencer</th>
                <th className="pb-2.5 font-medium">Platform</th>
                <th className="pb-2.5 font-medium">Niche</th>
                <th className="pb-2.5 font-medium">Spend</th>
                <th className="pb-2.5 font-medium">Revenue</th>
                <th className="pb-2.5 font-medium">ROAS</th>
                <th className="pb-2.5 font-medium">Conversions</th>
                <th className="pb-2.5 font-medium">CPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {influencers.map((inf: any) => (
                <tr key={inf.id} className="hover:bg-card-hover/50 transition-colors">
                  <td className="py-3 font-semibold text-white">
                    <Link href={`/influencers/${inf.id}`} className="hover:text-primary transition-colors">
                      @{inf.handle}
                    </Link>
                  </td>
                  <td className="py-3">
                    <PlatformBadge platform={inf.platform} />
                  </td>
                  <td className="py-3 text-muted">{inf.niche}</td>
                  <td className="py-3 text-slate-300">{formatINR(inf.spend, true)}</td>
                  <td className="py-3 font-semibold text-white">{formatINR(inf.revenue, true)}</td>
                  <td className="py-3 font-bold text-secondary">{formatROAS(inf.roas)}</td>
                  <td className="py-3 font-medium text-white">{formatNumber(inf.conversions)}</td>
                  <td className="py-3 text-slate-300">{formatINR(inf.cpa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
