import { useState } from "react";
import RecordingPlayer from "./recordingPlayer";
import "../styles/recordingList.css";

const initialRecordings = [
];

const RecordingList = () => {
  const [recordings, setRecordings] = useState(initialRecordings);

  const removeRecording = (id) => {
    setRecordings((prev) => prev.filter((rec) => rec.id !== id));
  };

  if (!recordings.length) {
    return <div className="rl-empty">No recordings... <i>yet</i></div>;
  }

  return (
    <div className="rl-list">
      {recordings.map((rec) => (
        <div key={rec.id} className="rl-item">
          <RecordingPlayer recording={rec} onDelete={() => removeRecording(rec.id)} />
        </div>
      ))}
    </div>
  );
};

export default RecordingList;
