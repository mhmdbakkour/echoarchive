import { create } from "zustand";

export const useRecordingStore = create((set, get) => ({
  recordings: [],

  addRecording: (rec) =>
    set((state) => ({ recordings: [rec, ...state.recordings] })),

  removeRecording: (id) =>
    set((state) => ({ recordings: state.recordings.filter((r) => r.id !== id) })),

  setRecordings: (arr) => set({ recordings: arr }),
  getRecording: (id) => get().recordings.find((r) => r.id === id),
}));