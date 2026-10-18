"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendPoint } from "@/types";
import { formatINR } from "@/lib/utils";

interface RevenueTrendChartProps {
  data: TrendPoint[];
}

export default function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-muted text-sm border border-dashed border-border rounded-xl">
        No performance trends available for selected period.
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => {
              try {
                const parts = val.split("-");
                return `${parts[1]}/${parts[2]}`;
              } catch (_) {
                return val;
              }
            }}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => formatINR(val, true)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#151D2E",
              borderColor: "#1E293B",
              borderRadius: "12px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
              color: "#F8FAFC",
              fontSize: "12px",
            }}
            formatter={(value: any, name: any) => [
              formatINR(Number(value)),
              name === "revenue" ? "Attributed Revenue" : "Marketing Spend",
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="revenue"
            stroke="#8B5CF6"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#revenueGrad)"
          />
          <Area
            type="monotone"
            dataKey="spend"
            name="spend"
            stroke="#22D3EE"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#spendGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
