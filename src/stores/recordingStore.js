import { create } from "zustand";
import { fetchRecordings, uploadRecording as apiUploadRecording, deleteRecording as apiDeleteRecording } from "../utils/recordingsAPI";
import { Recording } from "../models/Recording";

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

function createdAtToMs(createdAt) {
  if (createdAt === undefined || createdAt === null) return Date.now();
  if (typeof createdAt === "number") {
    if (createdAt < 1e12) return createdAt * 1000;
    return createdAt;
  }
  const n = Date.parse(String(createdAt));
  if (!Number.isNaN(n)) return n;
  return Date.now();
}

/* Fetch blob by path (server may return full URL or relative blob_path) */
async function fetchBlobFromPath(blobPath) {
  if (!blobPath) return null;
  let url = String(blobPath);
  if (!/^https?:\/\//i.test(url)) {
    url = `${BACKEND_BASE}/${url.replace(/^\/+/, "")}`;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch blob ${res.status}`);
    const blob = await res.blob();
    return blob;
  } catch (err) {
    console.warn("fetchBlobFromPath failed:", err);
    return null;
  }
}

/* sanitize before sending to backend (drop DOM refs / functions) */
function sanitizeRecordingForPayload(r) {
  if (!r || typeof r !== "object") return r;
  const copy = { ...r };
  delete copy.audio;
  delete copy.audioRef;
  Object.keys(copy).forEach((k) => {
    const v = copy[k];
    if (typeof v === "function") delete copy[k];
    if (v && typeof v === "object" && v instanceof HTMLElement) delete copy[k];
  });
  return copy;
}

export const useRecordingStore = create((set, get) => ({
  recordings: [],

  // Initialize: fetch metadata, set normalized metadata, then fetch blobs async and attach blob/audio/duration
  init: async () => {
    try {
      const server = await fetchRecordings();
      if (!Array.isArray(server)) {
        set({ recordings: [] });
        return;
      }

      const normalized = server.map((s) => {
        const id = s.id;
        const createdAtMs = createdAtToMs(s.created_at ?? s.createdAt ?? s.createdAtSec ?? s.createdAtMs ?? s.ts);
        return {
          ...s,
          id,
          createdAt: createdAtMs,
          blob_path: s.blob_path || s.blobPath || s.file_path || s.filePath || null,
          // model fields expected by your Recording model:
          blob: null,
          audio: null,
          duration: s.duration ?? 0,
        };
      });

      set({ recordings: normalized.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) });

      normalized.forEach(async (meta) => {
        if (!meta.blob_path) return;
        const blob = await fetchBlobFromPath(meta.blob_path);
        if (!blob) return;
        // create audio + duration using your Recording model logic
        try {
          const tempRec = await Recording.fromBlob(blob, meta.tags || [], meta.transcript || "", meta.sentiment || null);
          const audio = tempRec.audio;
          const duration = tempRec.duration || tempRec.duration === 0 ? tempRec.duration : meta.duration || 0;
          set((state) => ({
            recordings: state.recordings.map((r) =>
              String(r.id) === String(meta.id) ? { ...r, blob: tempRec.blob, audio, duration } : r
            ),
          }));
        } catch (e) {
          // fallback: create audio element without decoding duration
          try {
            const audio = new Audio(URL.createObjectURL(blob));
            audio.preload = "metadata";
            set((state) => ({
              recordings: state.recordings.map((r) =>
                String(r.id) === String(meta.id) ? { ...r, blob, audio } : r
              ),
            }));
          } catch (err) {
            console.warn("Failed to create audio element from blob:", err);
          }
        }
      });
    } catch (err) {
      console.warn("recordingStore.init failed (backend):", err?.message || err);
      set({ recordings: [] });
    }
  },

  // Add a session recording in-memory — match Recording model shape exactly
  addRecordingLocal: (rec) => {
    const recCopy = { ...rec };
    recCopy.id = recCopy.id;
    recCopy.createdAt = createdAtToMs(recCopy.createdAt ?? Date.now());
    if (!recCopy.audio && recCopy.blob) {
      // create audio + duration using Recording.fromBlob
      (async () => {
        try {
          const tempRec = await Recording.fromBlob(recCopy.blob, recCopy.tags || [], recCopy.transcript || "", recCopy.sentiment || null);
          recCopy.audio = tempRec.audio;
          recCopy.duration = tempRec.duration || recCopy.duration || 0;
          recCopy.blob = tempRec.blob;
          set((s) => ({ recordings: [recCopy, ...s.recordings] }));
        } catch (e) {
          // fallback: attach blob and create audio element without blocking
          try {
            recCopy.audio = new Audio(URL.createObjectURL(recCopy.blob));
            recCopy.audio.preload = "metadata";
          } catch (err) {}
          set((s) => ({ recordings: [recCopy, ...s.recordings] }));
        }
      })();
      return;
    }
    set((s) => ({ recordings: [recCopy, ...s.recordings] }));
  },

  // Upload to backend and on success process returned server record (including blob_path)
  uploadAndSave: async (rec) => {
    try {
      set((s) => ({ recordings: [rec, ...s.recordings.filter((r) => String(r.id) !== String(rec.id))] }));
    } catch (e) {}

    try {
      const payload = sanitizeRecordingForPayload(rec);
      const serverResp = await apiUploadRecording(payload);
      if (!serverResp) return null;

      const id = serverResp.id;
      const createdAtMs = createdAtToMs(serverResp.created_at ?? serverResp.createdAt ?? serverResp.ts);
      const blob_path = serverResp.blob_path || serverResp.blobPath || serverResp.file_path || serverResp.filePath || null;

      set((s) => ({
        recordings: s.recordings.map((r) =>
          String(r.id) === String(rec.id) || String(r.id) === String(id)
            ? { ...r, ...serverResp, id, createdAt: createdAtMs, blob_path }
            : r
        ),
      }));

      if (blob_path) {
        const blob = await fetchBlobFromPath(blob_path);
        if (blob) {
          try {
            const tempRec = await Recording.fromBlob(blob, serverResp.tags || [], serverResp.transcript || "", serverResp.sentiment || null);
            set((s) => ({
              recordings: s.recordings.map((r) =>
                String(r.id) === String(id) ? { ...r, blob: tempRec.blob, audio: tempRec.audio, duration: tempRec.duration } : r
              ),
            }));
          } catch (e) {
            const audio = new Audio(URL.createObjectURL(blob));
            audio.preload = "metadata";
            set((s) => ({
              recordings: s.recordings.map((r) =>
                String(r.id) === String(id) ? { ...r, blob, audio } : r
              ),
            }));
          }
        }
      }

      return serverResp;
    } catch (err) {
      console.warn("uploadAndSave backend failed:", err?.message || err);
      return null;
    }
  },

  // Delete remote and remove from memory
  deleteRecording: async (id) => {
    try {
      await apiDeleteRecording(id);
    } catch (err) {
      console.warn("backend delete failed (still removing locally):", err?.message || err);
    } finally {
      set((s) => ({ recordings: s.recordings.filter((r) => String(r.id) !== String(id)) }));
    }
  },

  // Refresh server list and repeat blob fetch/attach process
  syncNow: async () => {
    try {
      const server = await fetchRecordings();
      if (!Array.isArray(server)) return;
      const normalized = server.map((s) => {
        const id = s.id;
        const createdAtMs = createdAtToMs(s.created_at ?? s.createdAt ?? s.ts);
        return {
          ...s,
          id,
          createdAt: createdAtMs,
          blob_path: s.blob_path || s.file_path || s.filePath || null,
          blob: null,
          audio: null,
          duration: s.duration ?? 0,
        };
      });
      set({ recordings: normalized.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) });

      normalized.forEach(async (meta) => {
        if (!meta.blob_path) return;
        const blob = await fetchBlobFromPath(meta.blob_path);
        if (!blob) return;
        try {
          const tempRec = await Recording.fromBlob(blob, meta.tags || [], meta.transcript || "", meta.sentiment || null);
          set((state) => ({
            recordings: state.recordings.map((r) =>
              String(r.id) === String(meta.id) ? { ...r, blob: tempRec.blob, audio: tempRec.audio, duration: tempRec.duration } : r
            ),
          }));
        } catch (e) {
          const audio = new Audio(URL.createObjectURL(blob));
          audio.preload = "metadata";
          set((state) => ({
            recordings: state.recordings.map((r) =>
              String(r.id) === String(meta.id) ? { ...r, blob, audio } : r
            ),
          }));
        }
      });
    } catch (err) {
      console.warn("syncNow failed:", err?.message || err);
    }
  },

  getRecording: (id) => get().recordings.find((r) => String(r.id) === String(id)),
}));

export default useRecordingStore;