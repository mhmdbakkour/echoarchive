import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import "../../styles/charts/moodGradient.css";
import ChartTooltip from "./common/ChartTooltip";

function toDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  const n = Number(d);
  if (!Number.isNaN(n)) return new Date(n);
  return new Date(d);
}

function periodRange(period) {
  const now = new Date();
  let start;
  switch (period) {
    case "yesterday":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      break;
    case "yesterweek":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case "yestermonth":
      start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case "yesteryear":
      start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  }
  return [start.getTime(), now.getTime()];
}

function tickLabel(ts, period) {
  const d = new Date(ts);
  if (period === "yesterday") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (period === "yesterweek") return d.toLocaleDateString([], { weekday: "short" });
  if (period === "yestermonth") return `${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
  if (period === "yesteryear") return d.getFullYear();
  return d.toLocaleDateString();
}

function scoreColor(score) {
  if (score > 1) return "#0b5cff";
  if (score < -1) return "#ef4444";
  return "#94a3b8";
}

export default function MoodGradient({ data = [] }) {
  const [period, setPeriod] = useState("yesterday");

  const filteredPoints = useMemo(() => {
    const [start, end] = periodRange(period);
    return (data || [])
      .map(d => {
        const dt = toDate(d.date ?? d.createdAt ?? d.timestamp ?? d.ts ?? d.x);
        const score = d.sentiment?.score ?? d.score ?? d.value ?? 0;
        if (!dt || Number.isNaN(score)) return null;
        return { ts: dt.getTime(), score };
      })
      .filter(p => p && p.ts >= start && p.ts <= end)
      .sort((a, b) => a.ts - b.ts);
  }, [data, period]);

  if (!filteredPoints.length) return <div className="mg-wrapper">No mood data</div>;

  const minTs = filteredPoints[0].ts;
  const maxTs = filteredPoints[filteredPoints.length - 1].ts;

  return (
    <div className="mg-wrapper">
      <div className="mg-toolbar">
        <div className="mg-title">Mood Gradient</div>
        <div className="mg-controls" role="tablist" aria-label="Time range">
          {["yesterday", "yesterweek", "yestermonth", "yesteryear"].map(p => (
            <button
              key={p}
              className={`mg-btn ${p === period ? "active" : ""}`}
              onClick={() => setPeriod(p)}
              aria-pressed={p === period}
            >
              {p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mg-chart">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={filteredPoints} margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                {filteredPoints.map((p, i) => (
                  <stop
                    key={i}
                    offset={`${(i / (filteredPoints.length - 1)) * 100}%`}
                    stopColor={scoreColor(p.score)}
                  />
                ))}
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="#eef6ff" strokeDasharray="3 6" />
            <XAxis dataKey="ts" type="number" domain={[minTs, maxTs]} tickFormatter={v => tickLabel(v, period)} axisLine={false} tick={{ fill: "#475569", fontSize: 12 }} />
            <YAxis domain={[-5, 5]} axisLine={false} tick={{ fill: "#475569", fontSize: 12 }} />
            <Tooltip content={<ChartTooltip/>} />

            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={{ r: 4, fill: "#fff", stroke: "#000", strokeWidth: 1 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
