"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Cpu,
  BarChart3,
  Sliders,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  DollarSign,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100 flex flex-col selection:bg-primary/30">
      {/* Navbar */}
      <header className="border-b border-border/80 bg-[#0B1020]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white shadow-lg shadow-purple-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white">
                CreatorPulse <span className="text-secondary font-medium">AI</span>
              </span>
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                Optimization Engine
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-white shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 relative overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-primary/30 text-xs font-semibold text-purple-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-secondary" />
            <span>Scientific Influencer Marketing ROI & Budget Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Measure Creator Impact. <br />
            <span className="bg-gradient-to-r from-primary via-purple-300 to-secondary bg-clip-text text-transparent">
              Optimize Every Marketing Rupee.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Move beyond subjective influencer picks and vanity metrics. CreatorPulse AI combines empirical 
            conversion tracking, <strong>SciPy constrained mathematical optimization</strong>, and verified 
            decision intelligence to maximize campaign returns.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 font-bold text-white shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02]"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/optimization"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-card hover:bg-card-hover border border-border hover:border-slate-600 font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
            >
              <Cpu className="w-4 h-4 text-secondary" />
              <span>SciPy SLSQP Optimizer</span>
            </Link>
          </div>

          {/* Social Proof & Metrics strip */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-card/60 border border-border/80">
              <span className="text-2xl font-black text-white">3.62x</span>
              <p className="text-xs text-muted">Portfolio Average ROAS</p>
            </div>
            <div className="p-4 rounded-xl bg-card/60 border border-border/80">
              <span className="text-2xl font-black text-secondary">+18.4%</span>
              <p className="text-xs text-muted">Modeled Revenue Lift</p>
            </div>
            <div className="p-4 rounded-xl bg-card/60 border border-border/80">
              <span className="text-2xl font-black text-white">₹35.0L</span>
              <p className="text-xs text-muted">Optimized Budget</p>
            </div>
            <div className="p-4 rounded-xl bg-card/60 border border-border/80">
              <span className="text-2xl font-black text-emerald-400">100%</span>
              <p className="text-xs text-muted">Evidence Grounded</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars Section */}
      <section className="py-20 px-6 border-t border-border/60 bg-[#0E1529]/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              The Four Pillars of CreatorPulse AI
            </h2>
            <p className="text-sm sm:text-base text-muted max-w-xl mx-auto">
              A comprehensive decision intelligence platform engineered specifically for performance marketing teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">1. Marketing Analytics</h3>
              <p className="text-xs text-muted leading-relaxed">
                Empirical calculations for ROAS, CPA, conversion rates, and net contribution. Ratios aggregated strictly from verified totals without false averaging.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-card border border-border hover:border-secondary/40 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary mb-4 group-hover:scale-105 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">2. SciPy Optimization</h3>
              <p className="text-xs text-muted leading-relaxed">
                Nonlinear constrained budget allocation using SLSQP. Solves diminishing return response curves R_i(b_i) = A_i(1 - exp(-k_i · b_i)) under exact budget and platform caps.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-card border border-border hover:border-purple-500/40 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">3. What-If Simulation</h3>
              <p className="text-xs text-muted leading-relaxed">
                Test alternative budget allocations, response rate shifts, and platform caps in real time. Save scenarios and compare projected business impacts side by side.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-card border border-border hover:border-emerald-500/40 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">4. Grounded AI Insights</h3>
              <p className="text-xs text-muted leading-relaxed">
                Actionable recommendations backed by verifiable mathematical evidence. Never hallucinates metrics or inflates predictive confidence scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 px-6 bg-[#0B1020]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>© 2026 CreatorPulse AI. All authoritative calculations computed via FastAPI & SciPy backend.</p>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/optimization" className="hover:text-white transition-colors">Optimization</Link>
            <Link href="/data-management" className="hover:text-white transition-colors">Data Management</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
