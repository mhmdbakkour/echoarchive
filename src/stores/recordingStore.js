import { create } from "zustand";
import { recordingsDb } from "../db/recordingsDb";
import { fetchRecordings, uploadRecording as apiUploadRecording, deleteRecording as apiDeleteRecording } from "../utils/recordingsAPI";

export const useRecordingStore = create((set, get) => ({
  recordings: [],

  addRecording: (rec) =>
    set((state) => ({ recordings: [rec, ...state.recordings] })),

  removeRecording: (id) =>
    set((state) => ({ recordings: state.recordings.filter((r) => r.id !== id) })),

  setRecordings: (arr) => set({ recordings: arr }),
  getRecording: (id) => get().recordings.find((r) => r.id === id),

  // persist a recording (by id) to IndexedDB (keeps existing behaviour)
  saveRecording: async (id) => {
    const rec = get().recordings.find((r) => r.id === id);
    if (!rec) throw new Error("Recording not found: " + id);

    await recordingsDb.recordings.put({
      id: rec.id,
      blob: rec.blob,
      createdAt: rec.createdAt,
      audioUrl: rec.audioUrl,
      transcript: rec.transcript,
      duration: rec.duration,
      sentiment: rec.sentiment,
    });
  },

  deleteRecordingFromDb: async (id) => {
    await recordingsDb.recordings.delete(id);
  },

  // Initialize store: load from IndexedDB, then fetch from backend and merge
  init: async () => {
    try {
      // load local cache first
      const local = (await recordingsDb.recordings.toArray()) || [];
      set({ recordings: local });

      // fetch server metadata and merge (server metadata wins for fields returned)
      try {
        const server = await fetchRecordings();
        if (Array.isArray(server)) {
          const map = new Map((local || []).map((r) => [String(r.id), r]));
          for (const s of server) {
            const key = String(s.id);
            const existing = map.get(key) || {};
            // merge: keep local blob/audioUrl if present, prefer server metadata otherwise
            const merged = { ...existing, ...s };
            map.set(key, merged);
            // persist merged metadata locally (will not remove existing blob field if present)
            await recordingsDb.recordings.put(merged);
          }
          const mergedArr = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          set({ recordings: mergedArr });
        }
      } catch (err) {
        // backend may be unreachable; keep local cache
        console.warn("fetchRecordings backend failed (continuing offline):", err?.message || err);
      }
    } catch (err) {
      console.error("recordingStore.init failed:", err);
    }
  },

  // Save locally and attempt upload to backend (non-blocking)
  uploadAndSave: async (rec) => {
    try {
      // persist locally first
      await recordingsDb.recordings.put(rec);
      set((state) => ({ recordings: [rec, ...state.recordings.filter((r) => r.id !== rec.id)] }));
    } catch (err) {
      console.warn("local save failed:", err);
    }

    // try upload (fire-and-forget). If backend returns updated metadata, merge it locally.
    (async () => {
      try {
        const serverResp = await apiUploadRecording(rec);
        if (serverResp && serverResp.id !== undefined) {
          // merge and persist server response
          const merged = { ...rec, ...serverResp };
          await recordingsDb.recordings.put(merged);
          set((state) => ({
            recordings: state.recordings.map((r) => (String(r.id) === String(merged.id) ? merged : r)),
          }));
        }
      } catch (err) {
        console.warn("upload to backend failed (will remain in local cache):", err?.message || err);
        // do not remove local copy; retry can be implemented separately
      }
    })();
  },

  // Delete locally and attempt to delete on backend (best-effort)
  deleteRecording: async (id) => {
    try {
      await recordingsDb.recordings.delete(id);
      set((state) => ({ recordings: state.recordings.filter((r) => r.id !== id) }));
    } catch (err) {
      console.warn("local delete failed:", err);
    }

    // attempt backend delete
    try {
      await apiDeleteRecording(id);
    } catch (err) {
      console.warn("backend delete failed (local delete preserved):", err?.message || err);
      // Optionally mark deletion pending in DB if you have such mechanism
    }
  },

  // Manual sync: push local records that are missing on server, then refresh from server
  syncNow: async () => {
    try {
      const local = (await recordingsDb.recordings.toArray()) || [];
      // Option: detect items without remote id or some pending flag.
      // Minimal approach: attempt upload for items that have a blob and no server ack field.
      for (const r of local) {
        // heuristic: if recording has a blob and not flagged as uploaded, try upload
        if (r.blob && !r._uploaded) {
          try {
            const serverResp = await apiUploadRecording(r);
            if (serverResp) {
              const merged = { ...r, ...serverResp, _uploaded: true };
              await recordingsDb.recordings.put(merged);
            }
          } catch (e) {
            // continue; we'll leave local copy for future retry
            console.warn("sync upload failed for", r.id, e?.message || e);
          }
        }
      }

      // refresh server list and merge
      try {
        const server = await fetchRecordings();
        if (Array.isArray(server)) {
          const map = new Map((await recordingsDb.recordings.toArray()).map((x) => [String(x.id), x]));
          for (const s of server) {
            const existing = map.get(String(s.id)) || {};
            const merged = { ...existing, ...s };
            map.set(String(s.id), merged);
            await recordingsDb.recordings.put(merged);
          }
          const all = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          set({ recordings: all });
        }
      } catch (e) {
        console.warn("sync fetch failed:", e?.message || e);
      }
    } catch (err) {
      console.error("syncNow failed:", err);
    }
  },
}));

export default useRecordingStore;