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
  const transcriptContainerRef = useRef(null);
  const autoStopTimeoutRef = useRef(null);
  const addRecording = useRecordingStore((state) => state.addRecording);

  const sentimentAnalyzerRef = useRef(new Sentiment());
  const [sentiment, setSentiment] = useState(null);


  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const startTsRef = useRef(0);

  const createRecognition = () => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    //console.log("Speech Recognition available?", !!Rec);
    if (!Rec) return null;
    const rec = new Rec();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => console.log("Speech Recognition started");
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

    rec.onend = () => {
      console.log("SpeechRecognition ended");
      if (isRecordingRef.current) {
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
      rec.onend = null;
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
      };

      recorder.start();
      setRecording(true);
      isRecordingRef.current = true;

      startTsRef.current = Date.now();
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - startTsRef.current) / 1000);
        setElapsedSeconds(s);
      }, 250);

      startRecognitionIfAvailable();

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

    // setLiveTranscript("");
    // setSentiment(null);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    mediaRecorder.stop();
    setRecording(false);
    setMediaRecorder(null);
  };

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

  useEffect(() => {
    const el = transcriptContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;
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
