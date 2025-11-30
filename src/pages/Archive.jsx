import React, { useMemo, useState } from "react";
import RecordingPlayer from "../components/recordingPlayer";
import { useRecordingStore } from "../stores/recordingStore";
import "../styles/pages/archive.css";
import UtilityBar from "../components/UtilityBar";
import "../styles/utilityBar.css";

const Archive = () => {
  const recordings = useRecordingStore((s) => s.recordings || []);
  const removeRecording = useRecordingStore((s) => s.removeRecording);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = recordings.filter((r) => {
      if (!q) return true;
      const text = `${r.transcript || ""}`.toLowerCase();
      return text.includes(q);
    });
    out.sort((a, b) =>
      sort === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );
    return out;
  }, [recordings, query, sort]);

  return (
    <div className="archive-page">
      <header className="archive-header">
        <div>
          <h1>Your archive</h1>
        </div>
      </header>
      <UtilityBar
        query={query}
        setQuery={setQuery}
        sort={sort}
        setSort={setSort}
        count={filtered.length}
        onClear={() => setQuery("")}
        onExport={() => window.dispatchEvent(new CustomEvent("app:export-recordings", { detail: { ids: filtered.map(r => r.id) } }))}
      />

      <main>
        {filtered.length === 0 ? (
          <div className="archive-empty">
            No recordings found. Try recording something or adjust your search.
          </div>
        ) : (
          <div className="archive-grid">
            {filtered.map((rec) => (
              <div key={rec.id} className="archive-item">
                <RecordingPlayer recording={rec} onDelete={removeRecording}/>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Archive;
