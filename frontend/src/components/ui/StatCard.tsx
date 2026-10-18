"use client";

import React from "react";
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;
  tooltip?: string;
}

export default function StatCard({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  tooltip,
}: StatCardProps) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border hover:border-border-light transition-all duration-200 group relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1.5">
          {title}
          {tooltip && (
            <span title={tooltip} className="cursor-help">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
            </span>
          )}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl bg-background border border-border/80 group-hover:scale-105 transition-transform ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
              isPositive
                ? "text-emerald-400 bg-emerald-950/40 border border-emerald-500/20"
                : "text-rose-400 bg-rose-950/40 border border-rose-500/20"
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
    </div>
  );
}
