// Deprecated: IndexedDB removed. If you see this file imported anywhere, update that file
// to use the recording store (src/stores/recordingStore.js) and backend API (src/utils/recordingsAPI.js).
// This module intentionally throws to surface remaining usages.
const msg = `IndexedDB was removed. Replace imports of src/db/recordingsDb.js with useRecordingStore from src/stores/recordingStore.js and corresponding methods (uploadAndSave, deleteRecording, init, syncNow).`;

export function _throwDeprecated() {
  throw new Error(msg);
}

// exports that throw to surface any left-over usage
export const recordings = {
  put: () => _throwDeprecated(),
  delete: () => _throwDeprecated(),
  get: () => _throwDeprecated(),
  toArray: () => _throwDeprecated(),
  where: () => _throwDeprecated(),
};

export default { recordings, _throwDeprecated };