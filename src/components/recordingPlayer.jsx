import { useRef, useState, useEffect } from "react";
import {
  FaPlay,
  FaPause,
  FaClock,
  FaScroll,
  FaRegCopy,
  FaTrash,
  FaFloppyDisk,
  FaDownload
} from "react-icons/fa6";
import useRecordingStore from "../stores/recordingStore";
import "../styles/recordingPlayer.css";
import { useLocation } from "react-router-dom";

const RecordingPlayer = ({ recording, onDelete, onSaved, isCompact = false, isSession = false }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(
    typeof recording?.duration === "number" ? recording.duration : null
  );
  const [showTranscript, setShowTranscript] = useState(false);

  const uploadAndSave = useRecordingStore((s) => s.uploadAndSave);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);

  useEffect(() => {

    const audio = recording?.audio;
    if (!audio) return;

    audioRef.current = audio;

    if (
      typeof recording?.duration === "number" &&
      isFinite(recording.duration)
    ) {
      setDuration(recording.duration);
    } else if (isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }

    const onMeta = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    try {
      audio.load();
    } catch (e) {}

    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [recording]);

  const togglePlayback = async () => {
    const audio = audioRef.current || recording?.audio;
    if (!audio) return;
    audioRef.current = audio;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Audio play() failed, retrying from 0:", err);
        try {
          audio.currentTime = 0;
          await audio.play();
          setIsPlaying(true);
        } catch (err2) {
          console.warn("Retry play failed:", err2);
        }
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = pct * duration;
    setProgress(pct * 100);
  };

  const formatDuration = (seconds = 0) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds <= 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const createdAt = recording?.createdAt
    ? new Date(recording.createdAt).toLocaleString()
    : "";

  const copyTranscript = async () => {
    const t = recording?.transcript || "";
    try {
      await navigator.clipboard.writeText(t);
      alert("Transcript copied to clipboard.");
    } catch (e) {
      console.warn("Copy failed", e);
    }
  };

  const sentiment = recording?.sentiment || null;
  const sentimentEmoji = (() => {
    if (!sentiment || recording.transcript == "") return "❔";
    const lbl = String(sentiment.label || "").toLowerCase();
    const score = Number.isFinite(sentiment.score) ? sentiment.score : 0;
    if (lbl === "positive") return score > 10 ? "🤩" : "😊";
    if (lbl === "negative") return score < -10 ? "😡" : "☹️";
    return "😐";
  })();
  const sentimentTitle = sentiment
    ? `${sentiment.label} (${sentiment.score})`
    : "No sentiment";

  // exposed actions that replace any direct recordingsDb.put/delete calls
  const handleSave = async () => {
    try {
      const serverResp = await uploadAndSave(recording);
      if (serverResp) {
        if (typeof onSaved === "function") onSaved({ ...recording, ...serverResp });
      } else {
        console.warn("Save returned no server response; keep session item.");
      }
    } catch (err) {
      console.warn("Recording save/upload failed:", err);
    }
  };

  const handleDelete = async () => {
    try {
      // Session-only: parent manages removal, do not call backend
      if (isSession) {
        if (typeof onDelete === "function") onDelete(recording.id);
        return;
      }

      // Non-session (saved) recordings: delete on backend then notify parent
      await deleteRecording(recording.id);

      // let parent update UI if it wants to (optional)
      if (typeof onDelete === "function") onDelete(recording.id);
    } catch (err) {
      console.warn("Recording delete failed:", err);
    }
  };

  const location = useLocation();

  const blobType = (() => {
    if (!recording) return "";
    const t = recording?.blob?.type ?? recording?.fileType ?? recording?.mime ?? "";
    return String(t).toLowerCase();
  })();

  return (
    <div className={`rp-card ${isCompact ? "compact" : ""}`}>
      <audio ref={audioRef} preload="metadata" />
      <div className="rp-main">
        <button
          className={`rp-play ${isPlaying ? "playing" : ""}`}
          onClick={togglePlayback}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <div className="rp-meta">
          <div className="rp-row">
            <strong className="rp-title">Recording</strong>
            <div className="rp-time">
              <FaClock /> <span className="rp-created">{createdAt}</span>
            </div>
          </div>

          <div
            className="rp-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            onClick={seek}
            title="Click to seek"
          >
            <div
              className="rp-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="rp-controls-row">
            <div className="rp-duration">
              <span className="rp-current">
                {audioRef.current
                  ? formatDuration(audioRef.current.currentTime || 0)
                  : "0:00"}
              </span>
              <span className="rp-divider">/</span>
              <span className="rp-total">
                {duration ? formatDuration(duration) : "..."}
              </span>
            </div>

            <div className="rp-actions">
              <span
                className={`rp-sentiment-mini ${
                  ""
                }`}
                title={sentimentTitle}
                aria-hidden="true"
              >
                {sentimentEmoji}
              </span>
              <button
                className={`rp-transcript-toggle ${
                  showTranscript ? "open" : ""
                }`}
                onClick={() => setShowTranscript((s) => !s)}
                aria-expanded={showTranscript}
                title="Toggle transcript"
              >
                <FaScroll />
              </button>

              <button
                className="rp-copy"
                onClick={copyTranscript}
                title="Copy transcript"
              >
                <FaRegCopy />
              </button>

              {location.pathname === "/record" ?

              (<button
                className="rp-save"
                onClick={handleSave}
                title="Save recording"
                aria-label="Save recording"
              >
                <FaFloppyDisk />
              </button>)

              :

              (<button
                className="rp-export"
                title="Export recording"
                aria-label="Export recording"
              >
                <FaDownload />
              </button>)
              }


              <button
                className="rp-delete"
                onClick={handleDelete}
                title="Delete recording"
                aria-label="Delete recording"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`rp-transcript ${showTranscript ? "visible" : ""}`}>
        <div className="rp-transcript-inner">
          {recording?.transcript ? (
            <p>"{recording.transcript}"</p>
          ) : (
            <p className="rp-muted">No transcript available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordingPlayer;
