import React from "react";
import { useNavigate } from "react-router-dom";
import { useRecordingStore } from "../stores/recordingStore";
import SentimentTimeline from "../components/charts/sentimentTimeline";
import "../styles/pages/home.css";

export default function Home() {
  const navigate = useNavigate();
  const recordings = useRecordingStore((s) => s.recordings) || [];

  const total = recordings.length;
  const avgSentiment =
    total === 0
      ? 0
      : recordings
          .map((r) => Number(r.sentiment?.score ?? r.score ?? 0))
          .reduce((a, b) => a + b, 0) / total;

  const totalDuration = recordings
    .map((r) => Number(r.duration ?? r.len ?? 0))
    .reduce((a, b) => a + b, 0);

  const recent = [...recordings].sort((a, b) => (b.createdAt || b.date || b.ts) - (a.createdAt || a.date || a.ts)).slice(0, 8);

  return (
    <main className="home-root">
        <section className="home-hero">
        <div className="hero-left">
          <p className="hero-sub">
            Record, analyze, and explore your conversations. Quick insights and interactive charts help you understand your mood across time.
          </p>
          <div className="hero-cta">
            <button className="btn primary" onClick={() => navigate("/record")}>Start recording</button>
          </div>
        </div>

        <div className="hero-stats" aria-hidden>
          <div className="stat-card">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Recordings</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{avgSentiment ? avgSentiment.toFixed(2) : "—"}</div>
            <div className="stat-label">Avg sentiment</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{Math.round(totalDuration)}s</div>
            <div className="stat-label">Total duration</div>
          </div>
        </div>
      </section>

      <section className="home-grid">
        <div className="home-panel recordings-panel">
          <h2 className="panel-title">Recent recordings</h2>
          <ul className="recent-list">
            {recent.length === 0 ? (
              <li className="muted">No recordings yet</li>
            ) : (
              recent.map((r, i) => {
                const ts = r.createdAt ?? r.date ?? r.ts ?? r.timestamp;
                const title = r.title ?? `Recording ${i + 1}`;
                const d = ts ? new Date(ts) : null;
                const dur = r.duration ?? r.len ?? 0;
                const score = r.sentiment?.score ?? r.score ?? r.value;
                return (
                  <li key={r.id ?? i} className="recent-item">
                    <div className="ri-left">
                      <div className="ri-title">{title}</div>
                      <div className="ri-meta">
                        <span className="muted">{d ? d.toLocaleString() : "Unknown"}</span>
                        <span className="muted">• {Math.round(dur)}s</span>
                      </div>
                    </div>
                    <div className="ri-right">
                      <div className={`sentiment-badge ${score > 1 ? "pos" : score < -1 ? "neg" : "neu"}`}>
                        {score !== undefined ? Number(score).toFixed(1) : "—"}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="home-panel wide overview-panel">
          <h2 className="panel-title">Overview</h2>
          <p className="muted small">Explore the timeline and charts to see mood and duration trends. Use filters to focus on the timeframe you care about.</p>
          <div className="overview-actions">
            <button className="btn" onClick={() => navigate("/timeline")}>Open timeline</button>
          </div>
        </div>
      </section>

      <section className="home-timeline">
        <SentimentTimeline data={recordings} />
      </section>

      <footer className="home-footer">
        <small className="muted">Built with care — your recordings stay local unless you choose to save or export them.</small>
      </footer>
    </main>
  );
}