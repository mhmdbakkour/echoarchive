import React from "react";
import RecordingPlayer from "../components/recordingPlayer";
import { useRecordingStore } from "../stores/recordingStore";
import "../styles/archive.css";

const Archive = () => {
  const recordings = useRecordingStore((s) => s.recordings || []);
  const removeRecording = useRecordingStore((s) => s.removeRecording);

  return (
    <>
      <h1>Your archive</h1>
      <div className="archive-grid">
        {recordings.map((rec) => (
          <div key={rec.id} className="archive-item">
            <RecordingPlayer recording={rec} onDelete={removeRecording} />
          </div>
        ))}
      </div>
    </>
  );
};

export default Archive;
