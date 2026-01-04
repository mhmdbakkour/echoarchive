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
import ChartTooltip from "./common/chartTooltip";

function toDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  const n = Number(d);
  if (!Number.isNaN(n)) return new Date(n);
  console.log(d);
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
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  }
  return [start.getTime(), now.getTime()];
}

export default function DurationVsSentiment({ data = [] }) {
  const [period, setPeriod] = useState("yestermonth");

  const filtered = useMemo(() => {
    const [startTs, endTs] = periodRange(period);
    return (data || []).filter((d) => {
      const dt = toDate(d.date ?? d.timestamp ?? d.dt ?? d.x);
      const ts = dt?.getTime();
      return ts != null && ts >= startTs && ts <= endTs;
    });
  }, [data, period]);

  const processed = useMemo(() => {
    return (filtered || []).map((d, i) => {
      const dt = toDate(d.date ?? d.timestamp ?? d.dt ?? d.x);
      const ts = dt?.getTime();
      const score = Number(d.score ?? d.value ?? 0);
      const duration = Number(d.duration ?? d.len ?? d.seconds ?? 0);
      const r = Math.min(22, Math.max(6, Math.sqrt(duration || 0) * 1.6));
      const fill = score > 1 ? "#0b5cff" : score < -1 ? "#ef4444" : "#94a3b8";

      return {
        ...d,
        ts,
        date: dt,
        score,
        duration,
        r,
        fill,
        id: d.id ?? i,
        label: d.label ?? dt?.toISOString() ?? ""
      };
    });
  }, [filtered]);

  if (!processed.length) return <div className="dvs-wrapper">No data in this range</div>;

  return (
    <div className="dvs-wrapper">
      <div className="dvs-toolbar">
        <div className="dvs-title">Duration vs Sentiment</div>
        <div className="dvs-controls" role="tablist" aria-label="Time range">
          {["yesterday", "yesterweek", "yestermonth", "yesteryear"].map((p) => (
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
            <CartesianGrid stroke="#e6eef8" strokeDasharray="5 5" />
            <XAxis
              type="number"
              dataKey="score"
              name="Sentiment"
              domain={[-5, 5]}
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={true}
            />
            <YAxis
              type="number"
              dataKey="duration"
              name="Duration (s)"
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={true}
            />
            <Tooltip content={<ChartTooltip />} />
            <Scatter name="Recordings" data={processed} fill="#8884d8">
              {processed.map((entry) => (
                <circle
                  key={entry.id}
                  r={entry.r}
                  fill={entry.fill}
                  stroke="#fff"
                  strokeWidth={1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
