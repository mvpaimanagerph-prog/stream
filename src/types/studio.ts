/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SourceType =
  | 'webcam'
  | 'screen'
  | 'video'
  | 'image'
  | 'color'
  | 'text'
  | 'lowerthird'
  | 'ticker'
  | 'countdown'
  | 'browser';

export interface SourceCrop {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SourceConfig {
  // Webcam / Screen
  deviceId?: string;
  deviceLabel?: string;
  // Video / Audio / Media
  mediaId?: string;
  mediaUrl?: string;
  mediaName?: string;
  loop?: boolean;
  muted?: boolean;
  volume?: number;
  // Image
  imageUrl?: string;
  imageFit?: 'contain' | 'cover' | 'fill';
  // Color background
  color?: string;
  // Text Overlay
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  fontWeight?: 'normal' | 'bold' | '800';
  textAlign?: 'left' | 'center' | 'right';
  padding?: number;
  // Lower Third
  presenterName?: string;
  presenterRole?: string;
  accentColor?: string;
  lowerThirdStyle?: 'modern' | 'badge' | 'gradient';
  // News Ticker
  tickerText?: string;
  tickerSpeed?: number;
  tickerBgColor?: string;
  tickerTextColor?: string;
  // Countdown Timer
  durationMinutes?: number;
  countdownLabel?: string;
  countdownCompletedText?: string;
  // Browser overlay
  browserUrl?: string;
  browserTitle?: string;
}

export interface SourceItem {
  id: string;
  name: string;
  type: SourceType;
  x: number; // in 1920x1080 canvas coordinates
  y: number;
  width: number;
  height: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 1
  rotation: number; // degrees
  crop: SourceCrop;
  config: SourceConfig;
}

export interface Scene {
  id: string;
  name: string;
  sources: SourceItem[];
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  duration?: number;
  size?: number;
  isBuiltin?: boolean;
}

export interface AudioChannel {
  id: string;
  name: string;
  type: 'mic' | 'desktop' | 'media' | 'master';
  volume: number; // 0 to 1
  muted: boolean;
  levelRms: number; // 0 to 1 (dB calculated)
  levelPeak: number; // 0 to 1
  deviceId?: string;
  isAvailable: boolean;
}

export type AspectRatio = '16:9' | '9:16' | '4:3' | '1:1';
export type Resolution = '1080p' | '720p' | '480p';

export interface StreamConfig {
  destination: 'facebook' | 'youtube' | 'twitch' | 'custom';
  rtmpUrl: string;
  streamKey: string; // Runtime only! Masked and never saved to persistent storage
  resolution: Resolution;
  aspectRatio: AspectRatio;
  fps: 30 | 60;
  videoBitrate: number; // kbps, e.g. 4500
  audioBitrate: number; // kbps, e.g. 160
  encoder: 'browser-h264' | 'browser-vp8' | 'browser-vp9';
}

export type StreamStatus = 'offline' | 'connecting' | 'live' | 'reconnecting' | 'error';

export interface StreamTelemetry {
  uptimeSeconds: number;
  actualFps: number;
  currentKbps: number;
  droppedFrames: number;
  renderedFrames: number;
  cpuLoadEstimate: number; // 0 - 100%
}
