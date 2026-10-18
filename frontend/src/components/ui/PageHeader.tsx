"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  badge,
  badgeColor = "bg-primary/20 text-primary border-primary/30",
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/50">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{title}</h1>
          {badge && (
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-muted max-w-2xl">{subtitle}</p>
      </div>
      {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
    </div>
  );
}
