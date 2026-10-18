"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { PlatformBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Influencer } from "@/types";
import { formatINR, formatNumber, formatROAS } from "@/lib/utils";
import {
  Users,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Star,
  Activity,
  X,
} from "lucide-react";

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New creator form state
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [niche, setNiche] = useState("Tech");
  const [followers, setFollowers] = useState("250000");
  const [qualityScore, setQualityScore] = useState("88");
  const [submitting, setSubmitting] = useState(false);

  const fetchInfluencers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (platformFilter) params.platform = platformFilter;
      if (nicheFilter) params.niche = nicheFilter;
      const res = await api.get<Influencer[]>("/influencers", params);
      setInfluencers(res);
    } catch (err) {
      console.error("Failed to load influencers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfluencers();
  }, [platformFilter, nicheFilter]);

  const handleCreateInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/influencers", {
        name,
        handle,
        platform,
        niche,
        follower_count: parseInt(followers) || 0,
        audience_quality_score: parseFloat(qualityScore) || 85.0,
      });
      setIsModalOpen(false);
      setName("");
      setHandle("");
      fetchInfluencers();
    } catch (err: any) {
      alert(err.message || "Failed to create influencer");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = influencers.filter(
    (inf) =>
      inf.name.toLowerCase().includes(search.toLowerCase()) ||
      inf.handle.toLowerCase().includes(search.toLowerCase()) ||
      inf.niche.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Influencer Intelligence"
        subtitle="Creator portfolio analytics, audience authenticity ratings, and empirical ROI metrics."
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Influencer</span>
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
            placeholder="Search creators by name, handle, or niche..."
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
            <option value="INSTAGRAM">Instagram</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="TIKTOK">TikTok</option>
          </select>

          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-slate-300 focus:border-primary outline-none"
          >
            <option value="">All Niches</option>
            <option value="Tech">Tech</option>
            <option value="Fashion">Fashion</option>
            <option value="Fitness">Fitness</option>
            <option value="Beauty">Beauty</option>
            <option value="Finance">Finance</option>
            <option value="Food & Lifestyle">Food & Lifestyle</option>
          </select>
        </div>
      </div>

      {/* Influencers Table */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-3 font-medium">Influencer</th>
                <th className="pb-3 font-medium">Platform</th>
                <th className="pb-3 font-medium">Niche</th>
                <th className="pb-3 font-medium">Followers</th>
                <th className="pb-3 font-medium">Audience Score</th>
                <th className="pb-3 font-medium">Spend</th>
                <th className="pb-3 font-medium">Revenue</th>
                <th className="pb-3 font-medium">ROAS</th>
                <th className="pb-3 font-medium">CPA</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((inf) => (
                <tr key={inf.id} className="hover:bg-card-hover/50 transition-colors">
                  <td className="py-3.5">
                    <Link href={`/influencers/${inf.id}`} className="block group">
                      <span className="font-bold text-white group-hover:text-primary transition-colors">
                        {inf.name}
                      </span>
                      <span className="text-[11px] text-muted block">@{inf.handle}</span>
                    </Link>
                  </td>
                  <td className="py-3.5">
                    <PlatformBadge platform={inf.platform} />
                  </td>
                  <td className="py-3.5 text-muted">{inf.niche}</td>
                  <td className="py-3.5 font-medium text-white">{formatNumber(inf.follower_count)}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-2 rounded-full bg-background overflow-hidden border border-border/80">
                        <div
                          className="h-full bg-secondary rounded-full"
                          style={{ width: `${inf.audience_quality_score}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300">
                        {inf.audience_quality_score}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-300">{formatINR(inf.total_spend, true)}</td>
                  <td className="py-3.5 font-semibold text-white">{formatINR(inf.attributed_revenue, true)}</td>
                  <td className="py-3.5 font-bold text-secondary">{formatROAS(inf.roas)}</td>
                  <td className="py-3.5 text-slate-300">{formatINR(inf.cpa)}</td>
                  <td className="py-3.5 text-right">
                    <Link
                      href={`/influencers/${inf.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-light transition-colors"
                    >
                      <span>Analysis</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Creator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Add Influencer to Portfolio</h2>
            <p className="text-xs text-muted mb-5">Register a creator for campaign attribution and optimization.</p>

            <form onSubmit={handleCreateInfluencer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya Patel"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Social Handle</label>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="maya_tech"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Primary Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="TIKTOK">TikTok</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Niche Category</label>
                  <input
                    type="text"
                    required
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Tech, Fashion, Fitness"
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Follower Count</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={followers}
                    onChange={(e) => setFollowers(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Audience Quality Score (0-100)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    step="0.5"
                    value={qualityScore}
                    onChange={(e) => setQualityScore(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs text-white focus:border-primary outline-none"
                  />
                </div>
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
                  {submitting ? "Adding..." : "Add Creator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
