import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(val: number | null | undefined, compact: boolean = false): string {
  if (val === null || val === undefined || isNaN(val)) return "₹0.00";
  
  if (compact) {
    const absVal = Math.abs(val);
    if (absVal >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (absVal >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    if (absVal >= 1000) {
      return `₹${(val / 1000).toFixed(1)} K`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0";
  if (val >= 1000000) {
    return `${(val / 1000000).toFixed(1)}M`;
  }
  if (val >= 1000) {
    return `${(val / 1000).toFixed(1)}K`;
  }
  return val.toLocaleString("en-IN");
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0.0%";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

export function formatROAS(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0.00x";
  return `${val.toFixed(2)}x`;
}
