/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scene, AudioChannel, StreamConfig, MediaItem } from '../types/studio';

// Procedurally generate clean dark studio backdrop SVGs as data URIs for immediate, resilient rendering
const makeSvgBackground = (title: string, sub: string, grad1: string, grad2: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${grad1}"/>
        <stop offset="100%" stop-color="${grad2}"/>
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1920" height="1080" fill="url(#g)"/>
    <rect width="1920" height="1080" fill="url(#grid)"/>
    <circle cx="960" cy="540" r="420" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
    <circle cx="960" cy="540" r="580" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    <text x="960" y="520" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="64" fill="#ffffff" letter-spacing="4">${title}</text>
    <text x="960" y="580" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500" font-size="28" fill="rgba(255,255,255,0.6)" letter-spacing="2">${sub}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const BUILTIN_MEDIA: MediaItem[] = [
  {
    id: 'media_intro_loop',
    name: 'LiveStudio Intro Backdrop (1080p)',
    type: 'image',
    url: makeSvgBackground('LIVESTUDIO PH', 'BROADCAST PRODUCTION SUITE', '#0f172a', '#1e1b4b'),
    isBuiltin: true
  },
  {
    id: 'media_brb_loop',
    name: 'Intermission Standby Graphic',
    type: 'image',
    url: makeSvgBackground('BE RIGHT BACK', 'SHORT INTERMISSION · STREAMING WILL RESUME SHORTLY', '#18181b', '#27272a'),
    isBuiltin: true
  },
  {
    id: 'media_ending_loop',
    name: 'Stream Ending Graphic',
    type: 'image',
    url: makeSvgBackground('THANKS FOR WATCHING', 'FOLLOW @LIVESTUDIOPH ON FACEBOOK', '#09090b', '#1c1917'),
    isBuiltin: true
  }
];

export const DEFAULT_SCENES: Scene[] = [
  {
    id: 'scene_starting_soon',
    name: 'Starting Soon',
    sources: [
      {
        id: 'src_ss_bg',
        name: 'Background Graphic',
        type: 'image',
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        zIndex: 1,
        visible: true,
        locked: true,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          imageUrl: makeSvgBackground('STARTING SOON', 'PHILIPPINES LIVE STREAM · FB BROADCAST', '#090d16', '#1a2333'),
          imageFit: 'cover'
        }
      },
      {
        id: 'src_ss_countdown',
        name: 'Stream Countdown',
        type: 'countdown',
        x: 660,
        y: 620,
        width: 600,
        height: 140,
        zIndex: 2,
        visible: true,
        locked: false,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          durationMinutes: 5,
          countdownLabel: 'BROADCAST STARTS IN',
          countdownCompletedText: 'WE ARE LIVE NOW!',
          textColor: '#60a5fa'
        }
      },
      {
        id: 'src_ss_ticker',
        name: 'Welcome News Ticker',
        type: 'ticker',
        x: 0,
        y: 1000,
        width: 1920,
        height: 80,
        zIndex: 3,
        visible: true,
        locked: true,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          tickerText: '🔴 Welcome to LiveStudio PH! Like and follow our Facebook Page for upcoming broadcasts, tech talks, and live Q&A.',
          tickerSpeed: 3,
          tickerBgColor: 'rgba(15, 23, 42, 0.85)',
          tickerTextColor: '#ffffff'
        }
      }
    ]
  },
  {
    id: 'scene_main_camera',
    name: 'Main Camera',
    sources: [
      {
        id: 'src_cam_feed',
        name: 'Webcam Capture',
        type: 'webcam',
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        zIndex: 1,
        visible: true,
        locked: false,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          deviceLabel: 'Primary Camera'
        }
      },
      {
        id: 'src_cam_lowerthird',
        name: 'Host Lower Third',
        type: 'lowerthird',
        x: 80,
        y: 860,
        width: 640,
        height: 130,
        zIndex: 2,
        visible: true,
        locked: false,
        opacity: 0.95,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          presenterName: 'Juan Dela Cruz',
          presenterRole: 'Broadcast Engineer · Manila Studio',
          accentColor: '#2563eb',
          lowerThirdStyle: 'modern'
        }
      },
      {
        id: 'src_cam_logo',
        name: 'Channel Watermark',
        type: 'text',
        x: 1640,
        y: 50,
        width: 220,
        height: 50,
        zIndex: 3,
        visible: true,
        locked: true,
        opacity: 0.85,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          text: 'LIVESTUDIO PH',
          fontSize: 20,
          fontWeight: '800',
          textColor: '#ffffff',
          backgroundColor: 'rgba(239, 68, 68, 0.85)',
          padding: 8
        }
      }
    ]
  },
  {
    id: 'scene_gaming',
    name: 'Gaming',
    sources: [
      {
        id: 'src_game_screen',
        name: 'Screen / Game Capture',
        type: 'screen',
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        zIndex: 1,
        visible: true,
        locked: true,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          deviceLabel: 'Display / Window Share'
        }
      },
      {
        id: 'src_game_cam_pip',
        name: 'Facecam PiP',
        type: 'webcam',
        x: 1420,
        y: 720,
        width: 460,
        height: 320,
        zIndex: 2,
        visible: true,
        locked: false,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          deviceLabel: 'Primary Camera'
        }
      },
      {
        id: 'src_game_lowerthird',
        name: 'Game Streamer Tag',
        type: 'lowerthird',
        x: 80,
        y: 920,
        width: 520,
        height: 110,
        zIndex: 3,
        visible: true,
        locked: false,
        opacity: 0.9,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          presenterName: 'GamerPH Live',
          presenterRole: 'Playing Live on Facebook Gaming',
          accentColor: '#10b981',
          lowerThirdStyle: 'badge'
        }
      }
    ]
  },
  {
    id: 'scene_video_playlist',
    name: 'Video Playlist',
    sources: [
      {
        id: 'src_playlist_video',
        name: 'Media Player Screen',
        type: 'video',
        x: 160,
        y: 90,
        width: 1600,
        height: 900,
        zIndex: 1,
        visible: true,
        locked: false,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          mediaName: 'Intermission Showcase',
          mediaUrl: '',
          loop: true,
          volume: 0.85
        }
      },
      {
        id: 'src_playlist_ticker',
        name: 'Now Playing Banner',
        type: 'ticker',
        x: 0,
        y: 1010,
        width: 1920,
        height: 70,
        zIndex: 2,
        visible: true,
        locked: true,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          tickerText: 'NOW PLAYING: Philippine Showcase Highlights · Share this stream with your community!',
          tickerSpeed: 3,
          tickerBgColor: '#1e293b',
          tickerTextColor: '#f8fafc'
        }
      }
    ]
  },
  {
    id: 'scene_just_chatting',
    name: 'Just Chatting',
    sources: [
      {
        id: 'src_jc_bg',
        name: 'Studio Backdrop',
        type: 'color',
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        zIndex: 1,
        visible: true,
        locked: true,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          color: '#111827'
        }
      },
      {
        id: 'src_jc_cam',
        name: 'Center Webcam',
        type: 'webcam',
        x: 240,
        y: 100,
        width: 1440,
        height: 810,
        zIndex: 2,
        visible: true,
        locked: false,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          deviceLabel: 'Primary Camera'
        }
      },
      {
        id: 'src_jc_topic',
        name: 'Topic Discussion Card',
        type: 'text',
        x: 240,
        y: 930,
        width: 1440,
        height: 90,
        zIndex: 3,
        visible: true,
        locked: false,
        opacity: 0.95,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          text: '💬 Topic: Live Streaming Setup, Tools, & Meta Live Producer Best Practices · Drop your comments below!',
          fontSize: 24,
          textColor: '#f8fafc',
          backgroundColor: '#1e293b',
          padding: 18,
          textAlign: 'center'
        }
      }
    ]
  },
  {
    id: 'scene_brb',
    name: 'BRB',
    sources: [
      {
        id: 'src_brb_bg',
        name: 'BRB Background Card',
        type: 'image',
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        zIndex: 1,
        visible: true,
        locked: true,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          imageUrl: makeSvgBackground('BE RIGHT BACK', 'STEAMING COFFEE BREAK · STAND BY', '#18181b', '#09090b'),
          imageFit: 'cover'
        }
      },
      {
        id: 'src_brb_ticker',
        name: 'Standby Message Crawl',
        type: 'ticker',
        x: 0,
        y: 980,
        width: 1920,
        height: 80,
        zIndex: 2,
        visible: true,
        locked: true,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          tickerText: '☕ The broadcaster stepped away for a quick moment. Stream will resume in just 2 minutes! Stay tuned.',
          tickerSpeed: 4,
          tickerBgColor: '#0f172a',
          tickerTextColor: '#fbbf24'
        }
      }
    ]
  },
  {
    id: 'scene_ending_screen',
    name: 'Ending Screen',
    sources: [
      {
        id: 'src_end_bg',
        name: 'Ending Backdrop',
        type: 'image',
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        zIndex: 1,
        visible: true,
        locked: true,
        opacity: 1,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          imageUrl: makeSvgBackground('THANKS FOR WATCHING!', 'STREAM POWERED BY LIVESTUDIO PH', '#020617', '#0f172a'),
          imageFit: 'cover'
        }
      },
      {
        id: 'src_end_links',
        name: 'Social Links',
        type: 'text',
        x: 460,
        y: 680,
        width: 1000,
        height: 100,
        zIndex: 2,
        visible: true,
        locked: false,
        opacity: 0.95,
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        config: {
          text: 'Facebook Live: facebook.com/LiveStudioPH  ·  Twitter / X: @LiveStudioPH  ·  YouTube: LiveStudioPH',
          fontSize: 22,
          textColor: '#93c5fd',
          backgroundColor: '#0f172a',
          padding: 16,
          textAlign: 'center'
        }
      }
    ]
  }
];

export const DEFAULT_AUDIO_CHANNELS: AudioChannel[] = [
  {
    id: 'audio_mic',
    name: 'Mic / Auxiliary',
    type: 'mic',
    volume: 0.85,
    muted: false,
    levelRms: 0,
    levelPeak: 0,
    isAvailable: true
  },
  {
    id: 'audio_desktop',
    name: 'Desktop Audio',
    type: 'desktop',
    volume: 0.75,
    muted: false,
    levelRms: 0,
    levelPeak: 0,
    isAvailable: true
  },
  {
    id: 'audio_media',
    name: 'Media Player',
    type: 'media',
    volume: 0.70,
    muted: false,
    levelRms: 0,
    levelPeak: 0,
    isAvailable: true
  },
  {
    id: 'audio_master',
    name: 'Master Output',
    type: 'master',
    volume: 0.90,
    muted: false,
    levelRms: 0,
    levelPeak: 0,
    isAvailable: true
  }
];

export const DEFAULT_STREAM_CONFIG: StreamConfig = {
  destination: 'facebook',
  rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
  streamKey: '', // Kept in memory only, never saved to storage!
  resolution: '1080p',
  aspectRatio: '16:9',
  fps: 30,
  videoBitrate: 4500, // 4.5 Mbps (Facebook Live standard 1080p)
  audioBitrate: 160,
  encoder: 'browser-h264'
};
