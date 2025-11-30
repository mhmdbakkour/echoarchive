import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import "../../styles/charts/sentimentTimeline.css";
import ChartTooltip from "./common/ChartTooltip";


function toDate(d) {
  if (!d) return null;
  if (d instanceof Date && !isNaN(d)) return d;

  const n = Number(d);
  if (!Number.isNaN(n)) return new Date(n);

  const parsed = new Date(d);
  return isNaN(parsed) ? null : parsed;
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


function binData(data, period) {
  if (!data.length) return [];

  const [startTs, endTs] = periodRange(period);
  let interval;

  switch (period) {
    case "yesterday":
      interval = 60 * 60 * 1000; // 1 hour
      break;
    case "yesterweek":
      interval = 24 * 60 * 60 * 1000; // 1 day
      break;
    case "yestermonth":
      interval = 24 * 60 * 60 * 1000; // 1 day
      break;
    case "yesteryear":
      interval = 7 * 24 * 60 * 60 * 1000; // 1 week
      break;
    default:
      interval = 24 * 60 * 60 * 1000;
  }

  const binned = [];
  for (let ts = startTs; ts <= endTs; ts += interval) {
    const points = data.filter((p) => p.ts >= ts && p.ts < ts + interval);
    if (points.length) {
      const avgScore = points.reduce((sum, p) => sum + p.score, 0) / points.length;
      binned.push({ ts: ts + interval / 2, score: Math.round(avgScore * 100) / 100 });
    }
  }

  return binned;
}


function formatTick(ts, period) {
  const d = new Date(ts);
  if (period === "yesterday")
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (period === "yesterweek")
    return d.toLocaleDateString([], { weekday: "short" });
  if (period === "yestermonth")
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  if (period === "yesteryear")
    return d.toLocaleDateString([], { month: "short" });
  return d.toLocaleDateString();
}


export default function SentimentTimeline({ data = [] }) {
  const [period, setPeriod] = useState("yesterday");

  const rawData = useMemo(() => {
    return (data || [])
      .map((item) => {
        const raw =
          item.date ??
          item.x ??
          item.dt ??
          item.timestamp ??
          item.createdAt ??
          item.ts;
        const d = toDate(raw);
        if (!d) return null;

        const score = Number(
          item.score ?? item.value ?? item.y ?? item.sentiment?.score ?? 0
        );
        if (Number.isNaN(score)) return null;

        return { ts: d.getTime(), score };
      })
      .filter(Boolean)
      .sort((a, b) => a.ts - b.ts);
  }, [data]);

  const filtered = useMemo(() => {
    const [startTs, endTs] = periodRange(period);
    return rawData.filter((p) => p.ts >= startTs && p.ts <= endTs);
  }, [rawData, period]);

  const chartData = useMemo(
    () => binData(filtered, period),
    [filtered, period]
  );

  if (!chartData.length)
    return <div className="st-wrapper">No sentiment data available</div>;

  const minTs = chartData[0].ts;
  const maxTs = chartData[chartData.length - 1].ts;
  const large = chartData.length > 8;

  const yValues = chartData.map((d) => d.score);
  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues, 0);

  return (
    <div className="st-wrapper">
      <div className="st-toolbar">
        <div className="st-title">Sentiment timeline</div>
        <div className="st-controls" role="tablist" aria-label="Time range">
          {["yesterday", "yesterweek", "yestermonth", "yesteryear"].map((p) => (
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
          <LineChart
            data={chartData}
            margin={{ top: 18, right: 28, left: 8, bottom: 8 }}
          >
            <defs>
              <linearGradient id="stLine" x1="0" y1="1" x2="1" y2="1">
                <stop offset="0%" stopColor="#0b5cff" stopOpacity={0.98} />
                <stop offset="100%" stopColor="#ff36b2" stopOpacity={0.98} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#041021" strokeDasharray="3 6" />

            <XAxis
              dataKey="ts"
              type="number"
              domain={[minTs, maxTs]}
              axisLine={false}
              tick={{ fill: "#475569", fontSize: 12 }}
              tickFormatter={(v) => formatTick(v, period)}
              interval={large ? "preserveStartEnd" : 0}
            />

            <YAxis
              axisLine={false}
              domain={[minY - 1, maxY + 1]}
              tick={{ fill: "#475569", fontSize: 12 }}
            />

            <Tooltip content={<ChartTooltip />} />

            <Area
              type="monotone"
              dataKey="score"
              stroke="none"
              fill="url(#stArea)"
            />

            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#stLine)"
              strokeWidth={3}
              dot={{ r: 4, fill: "#0b5cff", stroke: "#fff", strokeWidth: 1 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
