"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ResponseCurveChart from "@/components/charts/ResponseCurveChart";
import { PlatformBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { formatINR, formatNumber, formatROAS, formatPercent } from "@/lib/utils";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Cpu,
  Target,
  ShoppingCart,
  Users,
  Activity,
  Zap,
} from "lucide-react";

export default function InfluencerDetailPage() {
  const params = useParams();
  const influencerId = params?.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!influencerId) return;
    api
      .get(`/influencers/${influencerId}`)
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [influencerId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-muted">Calibrating response curve...</div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-muted">Influencer profile not found.</div>
      </DashboardLayout>
    );
  }

  const { influencer, metrics, response_model } = data;

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/influencers" className="hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Influencer Intelligence
        </Link>
      </div>

      <PageHeader
        title={`${influencer.name} (@${influencer.handle})`}
        subtitle={`Niche: ${influencer.niche} • Platform: ${influencer.platform} • Followers: ${formatNumber(influencer.follower_count)}`}
      >
        <div className="flex items-center gap-3">
          <PlatformBadge platform={influencer.platform} />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border text-xs">
            <span className="text-muted">Audience Score:</span>
            <strong className="text-secondary">{influencer.audience_quality_score}/100</strong>
          </div>
        </div>
      </PageHeader>

      {/* Primary Historical KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attributed Revenue"
          value={formatINR(metrics.revenue, true)}
          subtitle={`Spend: ${formatINR(metrics.spend, true)}`}
          icon={TrendingUp}
          iconColor="text-primary"
        />
        <StatCard
          title="Historical ROAS"
          value={formatROAS(metrics.roas)}
          isPositive={metrics.roas >= 3.0}
          subtitle="Revenue ÷ Spend"
          icon={DollarSign}
          iconColor="text-secondary"
        />
        <StatCard
          title="Cost Per Acquisition"
          value={formatINR(metrics.cpa)}
          subtitle={`${formatNumber(metrics.conversions)} Orders`}
          icon={ShoppingCart}
          iconColor="text-purple-400"
        />
        <StatCard
          title="Engagement Rate"
          value={formatPercent(metrics.engagement_rate)}
          subtitle={`Impressions: ${formatNumber(metrics.impressions)}`}
          icon={Activity}
          iconColor="text-emerald-400"
        />
      </div>

      {/* Diminishing Return Response Curve Card */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-secondary" />
              <h3 className="text-base font-bold text-white">
                Diminishing-Return Exponential Response Curve
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                SciPy SLSQP Model
              </span>
            </div>
            <p className="text-xs text-muted">
              Modeled mathematical response:{" "}
              <code className="text-secondary font-mono">
                R(b) = A · (1 − e^(&minus;k·b))
              </code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-background border border-border text-center">
              <span className="text-[10px] text-muted block uppercase">Current Marginal Return</span>
              <span className="text-xs font-bold text-emerald-400">
                ₹{response_model.current_marginal_return} / ₹1 spent
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-background border border-border text-center">
              <span className="text-[10px] text-muted block uppercase">Saturation Attained</span>
              <span className="text-xs font-bold text-secondary">
                {response_model.current_saturation_pct}%
              </span>
            </div>
          </div>
        </div>

        <ResponseCurveChart
          points={response_model.curve_points}
          currentSpend={metrics.spend}
          currentRevenue={metrics.revenue}
          saturationCeiling={response_model.saturation_A}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-background border border-border/80 mt-6 text-xs text-muted">
          <div>
            <span className="font-semibold text-slate-300 block mb-0.5">Saturation Parameter (A)</span>
            <span className="font-mono text-white">{formatINR(response_model.saturation_A)}</span>
            <p className="text-[10px] mt-0.5">Theoretical upper asymptote on revenue ceiling.</p>
          </div>
          <div>
            <span className="font-semibold text-slate-300 block mb-0.5">Response Rate (k)</span>
            <span className="font-mono text-white">{response_model.response_rate_k}</span>
            <p className="text-[10px] mt-0.5">Governs how rapidly marginal returns diminish with spend.</p>
          </div>
          <div>
            <span className="font-semibold text-slate-300 block mb-0.5">Operating Point Indicator</span>
            <span className="text-purple-400 font-semibold">● Purple Marker</span>
            <p className="text-[10px] mt-0.5">Observed performance position in relation to theoretical limit.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
