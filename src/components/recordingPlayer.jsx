import React, { useEffect, useRef, useState } from "react";
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
import { useRecordingStore } from "../stores/recordingStore";
import "../styles/recordingPlayer.css";
import { useLocation } from "react-router-dom";

const RecordingPlayer = ({ recording, onDelete, isCompact = false }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(
    typeof recording?.duration === "number" ? recording.duration : null
  );
  const [showTranscript, setShowTranscript] = useState(false);

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

  
  const removeRecording = useRecordingStore((s) => s.removeRecording);
  const saveRecording = useRecordingStore((s) => s.saveRecording);
  const deleteRecordingFromDb = useRecordingStore((s) => s.deleteRecordingFromDb);

  async function handleSave() {
    await saveRecording(recording.id).then(() => {
      alert("Recording saved to IndexedDB.");
    }).catch((error) => {
      console.error("Error saving recording:", error);
      alert("Failed to save recording: " + error.message);
    });
  }

  const handleDelete = () => {
    if (!recording) return;
    const ok = window.confirm("Delete this recording? This cannot be undone.");
    if (!ok) return;

    if (typeof onDelete === "function") {
      onDelete(recording.id);
      deleteRecordingFromDb(recording.id);
      return;
    }

    if (typeof removeRecording === "function") {
      removeRecording(recording.id);
      deleteRecordingFromDb(recording.id);
      return;
    }

    try {
      const direct =
        typeof useRecordingStore.getState === "function"
          ? useRecordingStore.getState().removeRecording
          : undefined;
      if (typeof direct === "function") {
        direct(recording.id);
        return;
      }
    } catch (e) {
    }

    window.dispatchEvent(
      new CustomEvent("app:delete-recording", { detail: { id: recording.id } })
    );
    console.warn(
      "No delete handler available for recording id:",
      recording.id,
      "- dispatched app:delete-recording"
    );
  };

  const location = useLocation();

    return (
      <div className="rp-card">
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
                    sentiment.label.toLowerCase() || ""
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
