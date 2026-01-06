const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

async function handleRes(res) {
  if (res.ok) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
  }
  const text = await res.text().catch(() => res.statusText);
  throw new Error(`${res.status} ${res.statusText} - ${text}`);
}

/**
 * Fetch recordings metadata from backend.
 * Returns an array of recordings (may include metadata only).
 */
export async function fetchRecordings() {
  const res = await fetch(`${API_BASE}/recordings`, {
    method: "GET",
    credentials: "same-origin",
  });
  return handleRes(res);
}

/**
 * Upload recording (multipart/form-data).
 * Accepts recording object with fields: id, blob, tags, transcript, sentiment, duration, createdAt, fileName (optional)
 * Returns parsed backend response (metadata).
 */
export async function uploadRecording(recording) {
  const formData = new FormData();

  if (recording.blob) {
    const filename = recording.fileName || `recording-${recording.id || Date.now()}.webm`;
    formData.append("audio", recording.blob, filename);
  }
  

  if (recording.id !== undefined) formData.append("id", String(recording.id));
  if (recording.tags !== undefined) formData.append("tags", typeof recording.tags === "string" ? recording.tags : JSON.stringify(recording.tags || []));
  if (recording.transcript !== undefined) formData.append("transcript", String(recording.transcript));
  if (recording.sentiment !== undefined) formData.append("sentiment", typeof recording.sentiment === "string" ? recording.sentiment : JSON.stringify(recording.sentiment || {}));
  if (recording.duration !== undefined) formData.append("duration", String(recording.duration));
  if (recording.createdAt !== undefined) formData.append("createdAt", new Date(recording.createdAt).toISOString().slice(0, 19).replace('T', ' '));


  const res = await fetch(`${API_BASE}/recordings`, {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  return handleRes(res);
}

/**
 * Delete a recording by id.
 * Returns backend response.
 */
export async function deleteRecording(id) {
  const res = await fetch(`${API_BASE}/recordings/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  return handleRes(res);
}
