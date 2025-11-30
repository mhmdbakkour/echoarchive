import React, { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import "../../styles/charts/durationVsSentiment.css";
import ChartTooltip from "./common/ChartTooltip";

function toDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  const n = Number(d);
  if (!Number.isNaN(n)) return new Date(n);
  return new Date(d);
}

function since(period) {
  const now = Date.now();
  if (period === "daily") return now - 1000 * 60 * 60 * 24;
  if (period === "weekly") return now - 1000 * 60 * 60 * 24 * 7;
  if (period === "monthly") return now - 1000 * 60 * 60 * 24 * 30;
  return now - 1000 * 60 * 60 * 24 * 365;
}

export default function DurationVsSentiment({ data = [] }) {
  const [period, setPeriod] = useState("monthly");

  const filtered = useMemo(() => {
    const cutoff = since(period);
    return (data || []).filter((d) => {
      const dt = toDate(d.date ?? d.timestamp ?? d.dt ?? d.x);
      return dt && dt.getTime() >= cutoff;
    });
  }, [data, period]);

  const processed = useMemo(() => {
    return (filtered || []).map((d, i) => {
      const score = Number(d.score ?? d.value ?? 0);
      const duration = Number(d.duration ?? d.len ?? d.seconds ?? 0);
      const r = Math.min(22, Math.max(6, Math.sqrt(duration || 0) * 1.6));
      const fill = score > 1 ? "#0b5cff" : score < -1 ? "#ef4444" : "#94a3b8";
      return {
        ...d,
        score,
        duration,
        r,
        fill,
        id: d.id ?? i,
        label: d.label ?? d.date ?? ""
      };
    });
  }, [filtered]);

  const tooltipFormatter = (value, name) => {
    if (name === "score") return [`${value}`, "Sentiment"];
    if (name === "duration") return [`${value}s`, "Duration"];
    return [value, name];
  };

  return (
    <div className="dvs-wrapper">
      <div className="dvs-toolbar">
        <div className="dvs-title">Duration vs Sentiment</div>
        <div className="dvs-controls" role="tablist" aria-label="Time range">
          {["daily", "weekly", "monthly", "yearly"].map((p) => (
            <button
              key={p}
              className={`dvs-btn ${p === period ? "active" : ""}`}
              onClick={() => setPeriod(p)}
              aria-pressed={p === period}
            >
              {p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="dvs-chart">
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="#475569" strokeDasharray="3 6" />
            <XAxis
              type="number"
              dataKey="score"
              name="Sentiment"
              domain={[-5, 5]}
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={false}
            />
            <YAxis
              type="number"
              dataKey="duration"
              name="Duration (s)"
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Scatter name="Recordings" data={processed} fill="#8884d8" shape="circle">
              {processed.map((entry) => (
                <circle key={entry.id} cx={0} cy={0} r={entry.r} fill={entry.fill} stroke="#fff" strokeWidth={1} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}