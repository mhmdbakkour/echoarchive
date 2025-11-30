import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import "../../styles/charts/sentimentTimeline.css";
import ChartTooltip from "./common/ChartTooltip";

function toDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  const n = Number(d);
  if (!Number.isNaN(n)) return new Date(n);
  const parsed = new Date(d);
  return isNaN(parsed) ? null : parsed;
}

function since(period) {
  const now = Date.now();
  if (period === "daily") return now - 1000 * 60 * 60 * 24;
  if (period === "weekly") return now - 1000 * 60 * 60 * 24 * 7;
  if (period === "monthly") return now - 1000 * 60 * 60 * 24 * 30;
  return now - 1000 * 60 * 60 * 24 * 365;
}

function formatTick(ts, period) {
  const d = new Date(ts);
  if (period === "daily") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (period === "weekly") return d.toLocaleDateString();
  if (period === "monthly") return `${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
  return d.getFullYear();
}

function sampleFarthest(points, k) {
  if (!points || points.length <= k) return [...points];
  const n = points.length;
  const selected = new Set([0, n - 1]);
  while (selected.size < k) {
    let bestIdx = -1;
    let bestDist = -1;
    for (let i = 0; i < n; i++) {
      if (selected.has(i)) continue;
      let minDist = Infinity;
      for (const s of selected) {
        const d = Math.abs(points[i].ts - points[s].ts);
        if (d < minDist) minDist = d;
      }
      if (minDist > bestDist) {
        bestDist = minDist;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    selected.add(bestIdx);
  }
  return Array.from(selected)
    .sort((a, b) => a - b)
    .map((i) => points[i]);
}

export default function SentimentTimeline({ data = [] }) {
  const [period, setPeriod] = useState("daily");

  const rawData = useMemo(() => {
    return (data || [])
      .map((item) => {
        const raw = item.date ?? item.x ?? item.dt ?? item.timestamp ?? item.createdAt ?? item.ts;
        const d = toDate(raw);
        if (!d) return null;
        const score = Number(item.score ?? item.value ?? item.y ?? item.sentiment?.score ?? 0);
        if (Number.isNaN(score)) return null;
        return { ts: d.getTime(), score };
      })
      .filter(Boolean)
      .sort((a, b) => a.ts - b.ts);
  }, [data]);

  const cutoff = useMemo(() => since(period), [period]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return rawData.filter((p) => p.ts >= cutoff && p.ts <= now);
  }, [rawData, cutoff]);

  const chartData = useMemo(() => {
    const MAX = 50;
    if (filtered.length <= MAX) return filtered;
    return sampleFarthest(filtered, MAX);
  }, [filtered]);

  if (!chartData || chartData.length === 0) return null;

  const minVisibleTs = Math.min(...chartData.map((r) => r.ts));
  const maxVisibleTs = Math.max(...chartData.map((r) => r.ts));
  const domainMin = cutoff;
  const domainMax = Math.max(maxVisibleTs, domainMin + 1);
  const large = chartData.length > 8;

  return (
    <div className="st-wrapper">
      <div className="st-toolbar">
        <div className="st-title">Sentiment timeline</div>
        <div className="st-controls" role="tablist" aria-label="Time range">
          {["daily","weekly","monthly","yearly"].map((p) => (
            <button
              key={p}
              className={`st-btn ${p === period ? "active" : ""}`}
              onClick={() => setPeriod(p)}
              aria-pressed={p === period}
            >
              {p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="st-chart">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 18, right: 28, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="stArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0b5cff" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#ff36b2" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#e6eef8" strokeDasharray="3 6" />
            <XAxis
              dataKey="ts"
              type="number"
              domain={[domainMin, domainMax]}
              axisLine={false}
              tick={{ fill: "#475569", fontSize: 12 }}
              tickFormatter={(v) => formatTick(v, period)}
              interval={large ? "preserveStartEnd" : 0}
            />
            <YAxis domain={["dataMin - 1", "dataMax + 1"]} axisLine={false} tick={{ fill: "#475569", fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} />

            <Area type="monotone" dataKey="score" stroke="none" fill="url(#stArea)" />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#ff4757"
              strokeWidth={3}
              dot={{ r: 4, stroke: "#fff", strokeWidth: 1 }}
              activeDot={{ r: 6 }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
