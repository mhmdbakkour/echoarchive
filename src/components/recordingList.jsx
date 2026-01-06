import React from "react";
import RecordingPlayer from "./recordingPlayer";
import "../styles/recordingList.css";

// RecordingList accepts a prop `recordings` (session-only) and `onRemove` callback
const RecordingList = ({ recordings = [], onDelete = () => {}, onSaved = () => {} }) => {
  if (!recordings || recordings.length === 0) {
    return <div className="rl-empty">No recordings yet</div>;
  }

  return (
    <div className="rl-list">
      {recordings.map((rec) => (
        <div key={rec.id} className="rl-item">
          <RecordingPlayer
            recording={rec}
            onDelete={() => onDelete(rec.id)}
            onSaved={() => onSaved(rec)}
            isSession={true}
          />
        </div>
      ))}
    </div>
  );
};

export default RecordingList;
