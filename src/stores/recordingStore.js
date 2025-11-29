import { create } from "zustand";
import { recordingsDb } from "../db/recordingsDb";

export const useRecordingStore = create((set, get) => ({
  recordings: [],

  addRecording: (rec) =>
    set((state) => ({ recordings: [rec, ...state.recordings] })),

  removeRecording: (id) =>
    set((state) => ({ recordings: state.recordings.filter((r) => r.id !== id) })),

  setRecordings: (arr) => set({ recordings: arr }),
  getRecording: (id) => get().recordings.find((r) => r.id === id),

  saveRecording: async (id) => {
    const rec = get().recordings.find((r) => r.id === id);
    if (!rec) throw new Error("Recording not found: " + id);
  
    await recordingsDb.recordings.put({
      id: rec.id,
      blob: rec.blob,
      createdAt: rec.createdAt,
      audioUrl: rec.audioUrl,
      transcript: rec.transcript,
      sentiment: rec.sentiment
    })
  },
  deleteRecordingFromDb: async (id) => {
    await recordingsDb.recordings.delete(id);
  }
}));