"use client";

import React from "react";

export function PlatformBadge({ platform }: { platform: string }) {
  const p = platform?.toUpperCase() || "";
  let style = "bg-slate-800 text-slate-300 border-slate-700";

  if (p === "INSTAGRAM") {
    style = "bg-pink-950/40 text-pink-300 border-pink-500/30";
  } else if (p === "YOUTUBE") {
    style = "bg-red-950/40 text-red-300 border-red-500/30";
  } else if (p === "TIKTOK") {
    style = "bg-cyan-950/40 text-cyan-300 border-cyan-500/30";
  } else if (p === "MULTI") {
    style = "bg-purple-950/40 text-purple-300 border-purple-500/30";
  }

  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border ${style}`}>
      {p}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() || "ACTIVE";
  let style = "bg-emerald-950/40 text-emerald-400 border-emerald-500/30";

  if (s === "PAUSED") {
    style = "bg-amber-950/40 text-amber-400 border-amber-500/30";
  } else if (s === "COMPLETED" || s === "ARCHIVED") {
    style = "bg-slate-800 text-slate-400 border-slate-700";
  } else if (s === "FAILED") {
    style = "bg-rose-950/40 text-rose-400 border-rose-500/30";
  }

  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border ${style}`}>
      {s}
    </span>
  );
}
