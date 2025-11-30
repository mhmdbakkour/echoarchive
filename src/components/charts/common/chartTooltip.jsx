import React from "react";
import "../../../styles/charts/common/chartTooltip.css";

function niceName(key) {
  if (!key) return "";
  const k = String(key).toLowerCase();
  if (k === "score" || k === "sentiment" || k === "value") return "Sentiment";
  if (k === "duration" || k === "len" || k === "seconds") return "Duration";
  if (k === "ts" || k === "timestamp" || k === "date") return "Time";
  return key[0].toUpperCase() + key.slice(1);
}

function formatValue(name, value) {
  if (name === "Duration") return `${Number(value).toFixed(0)}s`;
  if (name === "Sentiment") return Number(value).toFixed(2);
  if (typeof value === "number") return Number(value).toString();
  return String(value ?? "");
}

export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const seen = new Set();
  const rows = payload
    .filter((p) => p && (p.value !== undefined))
    .map((p) => {
      const rawKey = p.name ?? p.dataKey ?? p.dataKey;
      const labelName = niceName(rawKey);
      if (seen.has(labelName)) return null;
      seen.add(labelName);
      return {
        key: labelName,
        value: formatValue(labelName, p.value),
        raw: p.value
      };
    })
    .filter(Boolean);

  const title = (() => {
    const d = Number(label);
    if (!Number.isNaN(d)) return new Date(d).toLocaleString();
    try {
      const dt = new Date(label);
      if (!Number.isNaN(dt)) return dt.toLocaleString();
    } catch (e) {}
    return String(label ?? "");
  })();

  return (
    <div className="chart-tooltip">
      <div className="ct-title">{title}</div>
      <div className="ct-body">
        {rows.map((r) => {
          const cls = r.raw > 1 ? "pos" : r.raw < -1 ? "neg" : "neu";
          return (
            <div className="ct-row" key={r.key}>
              <div className="ct-label">{r.key}</div>
              <div className={`ct-value ${cls}`}>{r.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}