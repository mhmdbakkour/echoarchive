import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea
} from "recharts";
import "../../styles/charts/moodGradient.css";

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

function colorFor(score) {
  if (score > 1) return "#0b5cff";
  if (score < -1) return "#ef4444";
  return "#94a3b8";
}

function tickLabel(ts, period) {
  const d = new Date(ts);
  if (period === "daily") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (period === "weekly") return d.toLocaleDateString();
  if (period === "monthly") return `${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
  return d.getFullYear();
}

export default function MoodGradient({ data = [] }) {
  const [period, setPeriod] = useState("daily");

  const rawPoints = useMemo(() => {
    return (data || [])
      .map((d) => {
        const dt = toDate(d.date ?? d.createdAt ?? d.timestamp ?? d.ts ?? d.x);
        const score = d.sentiment?.score ?? d.score ?? d.value ?? 0;
        if (!dt || Number.isNaN(Number(score))) return null;
        return { ts: dt.getTime(), score: Number(score) };
      })
      .filter(Boolean)
      .sort((a, b) => a.ts - b.ts);
  }, [data]);

  const filteredPoints = useMemo(() => {
    const cutoff = since(period);
    return rawPoints.filter((p) => p.ts >= cutoff);
  }, [rawPoints, period]);

  const minTs = filteredPoints.length ? filteredPoints[0].ts : null;
  const maxTs = filteredPoints.length ? filteredPoints[filteredPoints.length - 1].ts : null;

  const segments = useMemo(() => {
    if (!filteredPoints.length) return [];
    if (filteredPoints.length === 1) {
      return [{
        id: `seg-${0}`,
        x1: filteredPoints[0].ts,
        x2: filteredPoints[0].ts + 1,
        colorFrom: colorFor(filteredPoints[0].score),
        colorTo: colorFor(filteredPoints[0].score)
      }];
    }
    const segs = [];
    for (let i = 0; i < filteredPoints.length - 1; i++) {
      const a = filteredPoints[i];
      const b = filteredPoints[i + 1];
      segs.push({
        id: `seg-${i}`,
        x1: a.ts,
        x2: b.ts,
        colorFrom: colorFor(a.score),
        colorTo: colorFor(b.score)
      });
    }
    return segs;
  }, [filteredPoints]);

  const chartData = useMemo(() => filteredPoints.map((p) => ({ ts: p.ts, score: p.score })), [filteredPoints]);

  if (!chartData.length) return null;

  return (
    <div className="mg-wrapper">
      <div className="mg-toolbar">
        <div className="mg-title">Mood Gradient</div>
        <div className="mg-controls" role="tablist" aria-label="Time range">
          {["daily", "weekly", "monthly", "yearly"].map((p) => (
            <button key={p} className={`mg-btn ${p === period ? "active" : ""}`} onClick={() => setPeriod(p)} aria-pressed={p === period}>
              {p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mg-chart">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
            <defs>
              {segments.map((s) => (
                <linearGradient key={s.id} id={s.id} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={s.colorFrom} stopOpacity={1} />
                  <stop offset="100%" stopColor={s.colorTo} stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid vertical={false} stroke="#eef6ff" strokeDasharray="3 6" />
            <XAxis
              dataKey="ts"
              type="number"
              domain={minTs != null && maxTs != null ? [minTs, maxTs] : undefined}
              tickFormatter={(v) => tickLabel(v, period)}
              axisLine={false}
              tick={{ fill: "#475569", fontSize: 12 }}
            />
            <YAxis domain={[-5, 5]} axisLine={false} tick={{ fill: "#475569", fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 8 }} />

            {segments.map((s) => (
              <ReferenceArea key={s.id} x1={s.x1} x2={s.x2} y1={-5} y2={5} fill={`url(#${s.id})`} fillOpacity={1} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
