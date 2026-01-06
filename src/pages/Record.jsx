import React, { useState } from "react";
import AudioRecorder from "../components/audioRecorder";
import RecordingList from "../components/recordingList";

export default function Record({recordings = [], onDelete = () => {}, onSaved = () => {}, handleNewRecording = () => {} }) {
  return (
    <main className="record-page">
      <h1>Record yourself</h1>
      <section className="recorder-area">
        <AudioRecorder onRecorded={handleNewRecording} />
      </section>

      <section className="session-list-area">
        <h2>Session recordings</h2>
        <RecordingList recordings={recordings} onDelete={onDelete} onSaved={onSaved} />
      </section>

    </main>
  );
}