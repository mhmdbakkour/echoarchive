import { use } from "react";
import { recordingsDb } from "../db/recordingsDb";
import { useRecordingStore } from "../stores/recordingStore";

export async function loadRecordingsFromIndexedDB() {
    const saved = await recordingsDb.recordings.toArray();

    const hydrated = saved.map((rec) => {
        const url = URL.createObjectURL(rec.blob);
        const audio = new Audio(url);
        return {
            ...rec,
            audio
        };
    });

    useRecordingStore.getState().setRecordings(hydrated);
}