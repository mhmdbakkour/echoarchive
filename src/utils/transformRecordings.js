export function transformRecordings(recordings) {
  return recordings.map((rec) => ({
    id: rec.id,
    date: new Date(rec.createdAt),
    score: rec.sentiment?.score ?? 0,
    duration: rec.audio.duration ?? 0,
  }));
}
