"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { PlatformBadge, StatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Campaign, Influencer } from "@/types";
import { formatINR, formatNumber, formatROAS } from "@/lib/utils";
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
} from "lucide-react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New campaign form state
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("CONVERSIONS");
  const [platform, setPlatform] = useState("MULTI");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("1000000");
  const [selectedInfluencers, setSelectedInfluencers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status_filter = statusFilter;
      if (platformFilter) params.platform_filter = platformFilter;
      const res = await api.get<Campaign[]>("/campaigns", params);
      setCampaigns(res);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    api.get<Influencer[]>("/influencers").then(setInfluencers).catch(() => {});
  }, [statusFilter, platformFilter]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/campaigns", {
        name,
        objective,
        platform,
        start_date: startDate,
        end_date: endDate || null,
        allocated_budget: parseFloat(budget) || 0,
        currency: "INR",
        status: "ACTIVE",
        influencer_ids: selectedInfluencers,
      });
      setIsModalOpen(false);
      setName("");
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Campaign Management"
        subtitle="Manage marketing campaigns, budget allocations, and performance tracking."
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Campaign</span>
        </button>
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns by name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs text-white placeholder:text-slate-500 focus:border-primary outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-slate-300 focus:border-primary outline-none"
          >
            <option value="">All Platforms</option>
            <option value="MULTI">Multi-Platform</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="TIKTOK">TikTok</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-slate-300 focus:border-primary outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Campaigns Listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => {
          const budgetUsedPct = c.allocated_budget > 0 ? (c.total_spend / c.allocated_budget) * 100 : 0;
          return (
            <div
              key={c.id}
              className="p-6 rounded-2xl bg-card border border-border hover:border-border-light transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <PlatformBadge platform={c.platform} />
                  <StatusBadge status={c.status} />
                </div>

                <Link
                  href={`/campaigns/${c.id}`}
                  className="block text-base font-bold text-white hover:text-primary transition-colors mb-2 line-clamp-1"
                >
                  {c.name}
                </Link>

                <div className="flex items-center gap-2 text-xs text-muted mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{c.start_date} {c.end_date ? `to ${c.end_date}` : "(Ongoing)"}</span>
                </div>

                {/* Budget Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Budget Spent</span>
                    <span className="font-semibold text-slate-200">
                      {formatINR(c.total_spend, true)} / {formatINR(c.allocated_budget, true)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-background overflow-hidden border border-border/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetUsedPct > 90 ? "bg-amber-400" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-background border border-border/80 text-center mb-4">
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Revenue</span>
                    <span className="text-xs font-bold text-white">{formatINR(c.attributed_revenue, true)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">ROAS</span>
                    <span className="text-xs font-bold text-secondary">{formatROAS(c.roas)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Orders</span>
                    <span className="text-xs font-bold text-white">{formatNumber(c.conversions)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted">Objective: {c.objective}</span>
                <Link
                  href={`/campaigns/${c.id}`}
                  className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
                >
                  <span>Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Create New Campaign</h2>
            <p className="text-xs text-muted mb-5">Define marketing objective, allocated budget, and platforms.</p>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q4 Festive Omnichannel Push"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Objective</label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                  >
                    <option value="CONVERSIONS">Conversions (E-commerce)</option>
                    <option value="REVENUE">Revenue Maximization</option>
                    <option value="AWARENESS">Brand Awareness</option>
                    <option value="TRAFFIC">Traffic & Clicks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                  >
                    <option value="MULTI">Multi-Platform</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="TIKTOK">TikTok</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Total Budget (INR ₹)</label>
                <input
                  type="number"
                  required
                  min="10000"
                  step="5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="1000000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-background border border-border text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
