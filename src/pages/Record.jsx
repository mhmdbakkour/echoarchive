import React from "react";
import AudioRecorder from "../components/audioRecorder";
import RecordingList from "../components/recordingList";

const Record = () => {
    return <>
    <h1>Record yourself</h1>
    <AudioRecorder/>
    <RecordingList/>
    </>
}

export default Record;