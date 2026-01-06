import { v4 as uuid4 } from 'uuid';

export class Recording {
  constructor(blob, tags = [], transcript = '', audio = null, duration = 0, sentiment = null) {
    this.id = uuid4();
    this.blob = blob;
    this.tags = tags;
    this.transcript = transcript;
    this.sentiment = sentiment;
    this.audio = audio;
    this.duration = duration;
    this.createdAt = Date.now();
  }

  static async fromBlob(blob, tags = [], transcript = '', sentiment = null) {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.preload = 'metadata';

    await new Promise((resolve, reject) => {
      audio.onloadedmetadata = () => resolve();
      audio.onerror = reject;
    });
    
    let duration = audio.duration;

    if (!isFinite(duration) || isNaN(duration) || duration === 0) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          duration = decoded.duration;
          ctx.close();
        }
      } catch (err) {
        console.warn('Could not decode audio to get duration:', err);
      }
    }

    return new Recording(blob, tags, transcript, audio, duration || 0, sentiment);
  }
}
