"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { AllocationRecommendation } from "@/types";
import { formatINR } from "@/lib/utils";

interface BudgetComparisonBarChartProps {
  allocations: AllocationRecommendation[];
}

export default function BudgetComparisonBarChart({ allocations }: BudgetComparisonBarChartProps) {
  if (!allocations || allocations.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-muted text-sm border border-dashed border-border rounded-xl">
        Run optimization to view baseline vs. recommended budget shifts.
      </div>
    );
  }

  const chartData = allocations.map((a) => ({
    name: `@${a.handle}`,
    baseline: a.baseline_budget,
    recommended: a.recommended_budget,
    change: a.budget_change,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748B"
            fontSize={10}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            interval={0}
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
            formatter={(val: any, name: any) => [
              formatINR(Number(val)),
              name === "recommended" ? "Recommended Budget" : "Baseline Budget",
            ]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
          />
          <Bar
            dataKey="baseline"
            name="baseline"
            fill="#64748B"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
          <Bar
            dataKey="recommended"
            name="recommended"
            fill="#8B5CF6"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
