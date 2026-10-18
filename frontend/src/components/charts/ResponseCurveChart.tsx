"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { formatINR } from "@/lib/utils";

interface CurvePoint {
  budget: number;
  expected_revenue: number;
  marginal_return: number;
}

interface ResponseCurveChartProps {
  points: CurvePoint[];
  currentSpend?: number;
  currentRevenue?: number;
  saturationCeiling?: number;
}

export default function ResponseCurveChart({
  points,
  currentSpend = 0,
  currentRevenue = 0,
  saturationCeiling,
}: ResponseCurveChartProps) {
  if (!points || points.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted text-sm border border-dashed border-border rounded-xl">
        Response curve model calibrating...
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="budget"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => formatINR(val, true)}
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
              "Expected Attributed Revenue",
            ]}
            labelFormatter={(label) => `Budget: ${formatINR(Number(label))}`}
          />
          <Line
            type="monotone"
            dataKey="expected_revenue"
            name="Expected Revenue"
            stroke="#22D3EE"
            strokeWidth={2.5}
            dot={false}
          />
          {currentSpend > 0 && currentRevenue > 0 && (
            <ReferenceDot
              x={currentSpend}
              y={currentRevenue}
              r={6}
              fill="#8B5CF6"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
