import React from "react";
import RecordingPlayer from "./recordingPlayer";
import { useRecordingStore } from "../stores/recordingStore";
import "../styles/recordingList.css";

const RecordingList = () => {
  const recordings = useRecordingStore((s) => s.recordings || []);
  const removeRecording = useRecordingStore((s) => s.removeRecording);

  if (!recordings || recordings.length === 0) {
    return <div className="rl-empty">No recordings yet</div>;
  }

  return (
    <div className="rl-list">
      {recordings.map((rec) => (
        <div key={rec.id} className="rl-item">
          <RecordingPlayer recording={rec} onDelete={removeRecording} />
        </div>
      ))}
    </div>
  );
};

export default RecordingList;
