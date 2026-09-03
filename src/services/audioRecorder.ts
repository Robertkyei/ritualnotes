/**
 * Audio Recording Service using the standard Web MediaRecorder API and AudioContext.
 * Handles microphone capture, chunk aggregation, base64 conversion, and real-time audio analysis.
 */

export interface RecordedAudioResult {
  blob: Blob;
  base64: string;
  mimeType: string;
  durationSeconds: number;
  audioUrl: string;
}

export class WebAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private pauseStartTime: number = 0;

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 
      Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  async start(): Promise<void> {
    if (!WebAudioRecorder.isSupported()) {
      throw new Error('Web MediaRecorder is not supported in this browser environment.');
    }

    this.audioChunks = [];
    this.startTime = Date.now();
    this.pausedDuration = 0;

    // Request microphone access
    this.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Setup Web Audio API analyser for live audio feedback
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (e) {
      console.warn('AudioContext visualization setup skipped:', e);
    }

    // Determine optimal supported audio MIME type
    let mimeType = 'audio/webm';
    const supportedTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav',
    ];

    for (const type of supportedTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }

    this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType });

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // Request data in chunks of 500ms
    this.mediaRecorder.start(500);
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.pauseStartTime = Date.now();
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      if (this.pauseStartTime > 0) {
        this.pausedDuration += Date.now() - this.pauseStartTime;
        this.pauseStartTime = 0;
      }
    }
  }

  getAudioLevels(): number[] {
    if (!this.analyser || !this.dataArray) {
      return [0.1, 0.2, 0.4, 0.2, 0.1];
    }
    this.analyser.getByteFrequencyData(this.dataArray);
    // Return normalized levels 0.0 - 1.0 across 8 buckets
    const bucketCount = 8;
    const bucketSize = Math.floor(this.dataArray.length / bucketCount);
    const levels: number[] = [];

    for (let i = 0; i < bucketCount; i++) {
      let sum = 0;
      for (let j = 0; j < bucketSize; j++) {
        sum += this.dataArray[i * bucketSize + j];
      }
      const avg = sum / (bucketSize * 255);
      levels.push(Math.min(1, Math.max(0.05, avg * 1.5)));
    }
    return levels;
  }

  async stop(): Promise<RecordedAudioResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('MediaRecorder was not initialized.'));
      }

      const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
      const totalDurationSec = Math.max(1, Math.round((Date.now() - this.startTime - this.pausedDuration) / 1000));

      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.audioChunks, { type: mimeType });
          const audioUrl = URL.createObjectURL(blob);
          
          // Convert Blob to base64
          const base64 = await this.blobToBase64(blob);

          // Cleanup stream tracks and context
          this.cleanup();

          resolve({
            blob,
            base64,
            mimeType,
            durationSeconds: totalDurationSec,
            audioUrl,
          });
        } catch (err) {
          this.cleanup();
          reject(err);
        }
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        this.blobToBase64(blob).then(base64 => {
          this.cleanup();
          resolve({
            blob,
            base64,
            mimeType,
            durationSeconds: totalDurationSec,
            audioUrl,
          });
        }).catch(reject);
      }
    });
  }

  cancel(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        resolve(res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
