import React, { useState, useRef, useEffect } from "react";
import Sentiment from "sentiment";
import { FaMicrophone, FaMicrophoneSlash, FaCirclePause, FaCirclePlay} from "react-icons/fa6";
import { useRecordingStore } from "../stores/recordingStore";
import { Recording } from "../models/Recording";
import "../styles/audioRecorder.css";

const AudioRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunks = useRef([]);
  const isRecordingRef = useRef(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const transcriptContainerRef = useRef(null); // added: ref for scrolling
  const autoStopTimeoutRef = useRef(null); // ensure auto-stop timer ref exists
  const addRecording = useRecordingStore((state) => state.addRecording);

  // sentiment analyzer + live state
  const sentimentAnalyzerRef = useRef(new Sentiment());
  const [sentiment, setSentiment] = useState(null); // { score, comparative, label } or null

  // new: timer state and refs
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const startTsRef = useRef(0);

  // helper to create SpeechRecognition (cross-browser)
  const createRecognition = () => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log("SpeechRecognition available?", !!Rec);
    if (!Rec) return null;
    const rec = new Rec();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => console.log("SpeechRecognition started");
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          transcriptRef.current += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      const text = (transcriptRef.current + interim).trim();
      setLiveTranscript(text);

      // update live sentiment each time results arrive
      try {
        const analysis = sentimentAnalyzerRef.current.analyze(text || "");
        const label =
          analysis.score > 1 ? "Positive" : analysis.score < -1 ? "Negative" : "Neutral";
        setSentiment({ score: analysis.score, comparative: analysis.comparative, label });
      } catch (err) {
        console.warn("Sentiment analysis failed:", err);
      }
    };

    rec.onerror = (err) => {
      console.warn("SpeechRecognition error:", err);
    };

    // Restart logic: only restart while we expect to be recording
    rec.onend = () => {
      console.log("SpeechRecognition ended");
      // only try to restart if recording is still active
      if (isRecordingRef.current) {
        // small delay/backoff to avoid tight loops when start() throws
        setTimeout(() => {
          try {
            if (recognitionRef.current && isRecordingRef.current) {
              recognitionRef.current.start();
              console.log("SpeechRecognition restarted");
            }
          } catch (e) {
            console.warn(
              "Failed to restart SpeechRecognition, will retry shortly",
              e
            );
            // another retry after slightly longer backoff
            setTimeout(() => {
              try {
                recognitionRef.current &&
                  isRecordingRef.current &&
                  recognitionRef.current.start();
              } catch (err) {
                console.warn("Retry failed:", err);
              }
            }, 500);
          }
        }, 200);
      }
    };

    return rec;
  };

  // start recognition after MediaRecorder/stream started
  const startRecognitionIfAvailable = () => {
    const rec = createRecognition();
    if (!rec) return;
    recognitionRef.current = rec;
    transcriptRef.current = "";
    setLiveTranscript("");
    try {
      rec.start();
    } catch (err) {
      console.warn("rec.start() threw, will retry:", err);
      setTimeout(() => {
        try {
          recognitionRef.current && recognitionRef.current.start();
        } catch (e) {
          console.warn("Retry start failed:", e);
        }
      }, 200);
    }
  };

  const stopRecognitionIfRunning = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.onend = null; // prevent restart when we intentionally stop
      rec.stop();
    } catch (e) {
      console.warn("stopRecognitionIfRunning stop() threw:", e);
    } finally {
      recognitionRef.current = null;
    }
  };

  const formatDuration = (seconds = 0) => {
    if (!isFinite(seconds) || seconds <= 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = String(Math.floor(seconds % 60)).padStart(2, "0");
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    if (recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      audioChunks.current = [];
      transcriptRef.current = "";
      setLiveTranscript("");
     setSentiment(null);

      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);

      recorder.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const transcript = transcriptRef.current.trim();
        // compute final sentiment for the saved recording
        let finalSentiment = sentiment;
        try {
          const analysis = sentimentAnalyzerRef.current.analyze(transcript || "");
          const label =
            analysis.score > 1 ? "Positive" : analysis.score < -1 ? "Negative" : "Neutral";
          finalSentiment = { score: analysis.score, comparative: analysis.comparative, label };
        } catch (err) {
          console.warn("Final sentiment analysis failed:", err);
        }

        const newRecording = await Recording.fromBlob(blob, [], transcript, finalSentiment);
        addRecording(newRecording);
        stream.getTracks().forEach((t) => t.stop());
        // leave elapsedSeconds as final value (optional: reset here)
      };

      recorder.start();
      setRecording(true);
      isRecordingRef.current = true;

      // start timer using timestamp to avoid drift
      startTsRef.current = Date.now();
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - startTsRef.current) / 1000);
        setElapsedSeconds(s);
      }, 250);

      // start recognition AFTER recorder.start()
      startRecognitionIfAvailable();

      // schedule auto-stop (existing logic you have elsewhere can be used)
      if (autoStopTimeoutRef?.current) clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = setTimeout(() => {
        if (isRecordingRef.current) stopRecording();
      }, 120000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (!recording || !mediaRecorder) return;
    isRecordingRef.current = false;
    stopRecognitionIfRunning();

    setLiveTranscript("");
    setSentiment(null);

    // stop and clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    mediaRecorder.stop();
    setRecording(false);
    setMediaRecorder(null);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecognitionIfRunning();
    };
  }, []);

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // auto-scroll transcript to bottom when new text arrives (respect user scroll)
  useEffect(() => {
    const el = transcriptContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return; // nothing to scroll
    // if user scrolled up more than 40px, don't yank them down
    const userScrolledUp = el.scrollTop < maxScroll - 40;
    if (userScrolledUp) return;
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } catch {
      el.scrollTop = el.scrollHeight;
    }
  }, [liveTranscript]);

  return (
    <div className="recorder-container">
      <button className={`toggle-recording-button${recording ? " recording" : ""}`} onClick={toggleRecording}>
        {recording ? <FaMicrophoneSlash /> : <FaMicrophone />}
      </button>

      <span className={`recording-timer${recording ? " recording" : ""}`}>{formatDuration(elapsedSeconds)}</span>
      <span
        className={`recording-sentiment ${sentiment ? sentiment.label.toLowerCase() : "unknown"} ${recording ? "" : "hidden"}`}
        title={sentiment ? `${sentiment.label} (${sentiment.score})` : "No sentiment"}
      >
        <span className={`sentiment-emoji ${recording ? "" : "hidden"}`} aria-hidden="true">
          {sentiment
            ? sentiment.score > 1
              ? sentiment.score < 20
                ? "😊"
                : "🤩"
              : sentiment.score < -1
              ? sentiment.score > -20
                ? "☹️"
                : "😡"
              : "😐"
            : "❔"}
        </span>
        <span className="sentiment-label">
          {sentiment ? `${sentiment.label} (${sentiment.score})` : "No sentiment"}
        </span>
      </span>

      <div className={`live-transcript ${recording ? "" : "hidden"}`}>
        <div
          className="live-transcript-inner"
          ref={transcriptContainerRef}
          aria-live="polite"
        >
          {liveTranscript ? <p>{liveTranscript}</p> : <p className="muted">No live transcript</p>}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;
