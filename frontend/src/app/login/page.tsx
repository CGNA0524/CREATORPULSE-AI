"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AuthResponse } from "@/types";
import { TrendingUp, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<AuthResponse>("/auth/login", { email, password });
      api.setAuthToken(res.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("admin@creatorpulse.ai");
    setPassword("Admin@123456");
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<AuthResponse>("/auth/login", {
        email: "admin@creatorpulse.ai",
        password: "Admin@123456",
      });
      api.setAuthToken(res.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with demo credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-white tracking-tight">CreatorPulse AI</span>
          </Link>
          <p className="text-sm text-muted">Sign in to access marketing analytics & optimization</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Login Option */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-950/60 to-cyan-950/60 hover:from-purple-900/80 hover:to-cyan-900/80 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <Sparkles className="w-3.5 h-3.5 text-secondary" />
            <span>One-Click Demo Sign In (Pre-seeded Portfolio)</span>
          </button>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-3 text-[11px] text-muted uppercase">or credentials</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-white placeholder:text-slate-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-white placeholder:text-slate-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "Signing In..." : "Sign In"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted">
          Need an account?{" "}
          <Link href="/register" className="text-secondary hover:underline font-medium">
            Register your organization
          </Link>
        </div>
      </div>
    </div>
  );
}
