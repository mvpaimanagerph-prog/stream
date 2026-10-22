/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export class MediaService {
  private static cameraStream: MediaStream | null = null;
  private static micStream: MediaStream | null = null;
  private static screenStream: MediaStream | null = null;

  // Web Audio pipeline for real microphone level calculation
  private static audioCtx: AudioContext | null = null;
  private static micSourceNode: MediaStreamAudioSourceNode | null = null;
  private static analyserNode: AnalyserNode | null = null;
  private static audioDataArray: Uint8Array<ArrayBuffer> | null = null;

  private static onDeviceChangeCallbacks: Set<() => void> = new Set();

  static init() {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        this.onDeviceChangeCallbacks.forEach(cb => cb());
      });
    }
  }

  static onDeviceChange(callback: () => void): () => void {
    this.onDeviceChangeCallbacks.add(callback);
    return () => {
      this.onDeviceChangeCallbacks.delete(callback);
    };
  }

  /**
   * Enumerate available video and audio devices
   */
  static async enumerateDevices(): Promise<{ cameras: DeviceInfo[]; microphones: DeviceInfo[] }> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { cameras: [], microphones: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras: DeviceInfo[] = [];
      const microphones: DeviceInfo[] = [];

      devices.forEach((dev, idx) => {
        if (dev.kind === 'videoinput') {
          cameras.push({
            deviceId: dev.deviceId,
            label: dev.label || `Camera ${idx + 1}`,
            kind: dev.kind
          });
        } else if (dev.kind === 'audioinput') {
          microphones.push({
            deviceId: dev.deviceId,
            label: dev.label || `Microphone ${idx + 1}`,
            kind: dev.kind
          });
        }
      });

      return { cameras, microphones };
    } catch (err) {
      console.warn('Could not enumerate devices:', err);
      return { cameras: [], microphones: [] };
    }
  }

  /**
   * Request Webcam Stream
   */
  static async getCameraStream(deviceId?: string): Promise<{ stream: MediaStream | null; error?: string }> {
    try {
      // Stop existing camera stream if any
      this.stopCamera();

      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } } : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.cameraStream = stream;
      return { stream };
    } catch (err: any) {
      let message = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera hardware found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is already in use by another application.';
      }
      return { stream: null, error: message };
    }
  }

  /**
   * Request Microphone Stream & Connect to Analyser
   */
  static async getMicStream(deviceId?: string): Promise<{ stream: MediaStream | null; error?: string }> {
    try {
      this.stopMic();

      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.micStream = stream;

      // Setup Web Audio Analyser
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }

        this.micSourceNode = this.audioCtx.createMediaStreamSource(stream);
        this.analyserNode = this.audioCtx.createAnalyser();
        this.analyserNode.fftSize = 256;
        this.analyserNode.smoothingTimeConstant = 0.5;
        this.micSourceNode.connect(this.analyserNode);

        this.audioDataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
      }

      return { stream };
    } catch (err: any) {
      let message = 'Failed to access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Microphone permission was denied. Please check browser permissions.';
      } else if (err.name === 'NotFoundError') {
        message = 'No microphone device found.';
      }
      return { stream: null, error: message };
    }
  }

  /**
   * Read real-time audio levels (RMS and Peak, 0 to 1) from microphone AnalyserNode
   */
  static getMicLevels(): { rms: number; peak: number } {
    if (!this.analyserNode || !this.audioDataArray || !this.micStream || !this.micStream.active) {
      return { rms: 0, peak: 0 };
    }

    try {
      this.analyserNode.getByteTimeDomainData(this.audioDataArray);
      let sumSquares = 0;
      let peak = 0;

      for (let i = 0; i < this.audioDataArray.length; i++) {
        // Center around 0 (-1 to 1)
        const normalized = (this.audioDataArray[i] - 128) / 128;
        const absVal = Math.abs(normalized);
        if (absVal > peak) peak = absVal;
        sumSquares += normalized * normalized;
      }

      const rms = Math.sqrt(sumSquares / this.audioDataArray.length);
      return {
        rms: Math.min(1, rms * 2.5), // Scale appropriately for UI fader meter
        peak: Math.min(1, peak * 1.5)
      };
    } catch {
      return { rms: 0, peak: 0 };
    }
  }

  /**
   * Request Screen / Window Capture
   */
  static async getScreenStream(): Promise<{ stream: MediaStream | null; error?: string }> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      return { stream: null, error: 'Screen capture is not supported in this browser environment.' };
    }

    try {
      this.stopScreen();
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: true
      });
      this.screenStream = stream;

      // Handle user stopping share via browser native banner
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        this.screenStream = null;
      });

      return { stream };
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        return { stream: null, error: 'Screen sharing permission was cancelled or denied.' };
      }
      return { stream: null, error: err.message || 'Unable to capture display.' };
    }
  }

  static getActiveCamera(): MediaStream | null {
    return this.cameraStream;
  }

  static getActiveScreen(): MediaStream | null {
    return this.screenStream;
  }

  static getActiveMic(): MediaStream | null {
    return this.micStream;
  }

  static stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
  }

  static stopMic() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch {}
      this.micSourceNode = null;
    }
  }

  static stopScreen() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
  }

  static cleanupAll() {
    this.stopCamera();
    this.stopMic();
    this.stopScreen();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

MediaService.init();
