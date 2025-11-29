import Dexie from 'dexie';

export const recordingsDb = new Dexie('EchoArchiveDB');

recordingsDb.version(1).stores({
  recordings: 'id, createdAt'});