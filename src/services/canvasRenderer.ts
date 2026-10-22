/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SourceItem, AspectRatio } from '../types/studio';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private videoElements: Map<string, HTMLVideoElement> = new Map();
  private animFrameId: number | null = null;
  private startTime: number = Date.now();

  // Internal video elements for camera and screen
  public cameraVideo: HTMLVideoElement;
  public screenVideo: HTMLVideoElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;

    // Create offscreen video elements to pipe MediaStreams
    this.cameraVideo = document.createElement('video');
    this.cameraVideo.autoplay = true;
    this.cameraVideo.muted = true;
    this.cameraVideo.playsInline = true;

    this.screenVideo = document.createElement('video');
    this.screenVideo.autoplay = true;
    this.screenVideo.muted = true;
    this.screenVideo.playsInline = true;
  }

  public setCameraStream(stream: MediaStream | null) {
    if (stream) {
      if (this.cameraVideo.srcObject !== stream) {
        this.cameraVideo.srcObject = stream;
        this.cameraVideo.play().catch(() => {});
      }
    } else {
      this.cameraVideo.srcObject = null;
    }
  }

  public setScreenStream(stream: MediaStream | null) {
    if (stream) {
      if (this.screenVideo.srcObject !== stream) {
        this.screenVideo.srcObject = stream;
        this.screenVideo.play().catch(() => {});
      }
    } else {
      this.screenVideo.srcObject = null;
    }
  }

  public getOrCreateVideoElement(id: string, url: string, loop: boolean = true, volume: number = 1): HTMLVideoElement {
    let video = this.videoElements.get(id);
    if (!video) {
      video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = url;
      video.loop = loop;
      video.muted = false;
      video.volume = volume;
      video.playsInline = true;
      video.play().catch(() => {});
      this.videoElements.set(id, video);
    } else if (video.src !== url) {
      video.src = url;
      video.loop = loop;
      video.play().catch(() => {});
    }
    return video;
  }

  public getImage(url: string): HTMLImageElement | null {
    if (!url) return null;
    if (this.imageCache.has(url)) {
      const img = this.imageCache.get(url)!;
      return img.complete ? img : null;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    this.imageCache.set(url, img);
    return null;
  }

  public render(
    sources: SourceItem[],
    selectedSourceId: string | null = null,
    showSafeMargins: boolean = false,
    aspectRatio: AspectRatio = '16:9'
  ) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const now = Date.now();
    const elapsedSeconds = (now - this.startTime) / 1000;

    // Clear background
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, width, height);

    // Sort visible sources by zIndex ascending
    const sorted = [...sources]
      .filter(s => s.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const source of sorted) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, source.opacity));

      // Coordinate transform & rotation
      const cx = source.x + source.width / 2;
      const cy = source.y + source.height / 2;
      ctx.translate(cx, cy);
      if (source.rotation) {
        ctx.rotate((source.rotation * Math.PI) / 180);
      }
      ctx.translate(-cx, -cy);

      // Render by type
      this.renderSource(source, elapsedSeconds);

      ctx.restore();
    }

    // Selected source bounding outline & handles
    if (selectedSourceId) {
      const selected = sources.find(s => s.id === selectedSourceId);
      if (selected && selected.visible) {
        this.renderSelectionOutline(selected);
      }
    }

    // Safe action and title margins (OBS Studio feature)
    if (showSafeMargins) {
      this.renderSafeMargins(width, height);
    }
  }

  private renderSource(source: SourceItem, elapsedSeconds: number) {
    const ctx = this.ctx;
    const { x, y, width, height, type, config } = source;

    switch (type) {
      case 'webcam': {
        const streamActive = this.cameraVideo.srcObject && (this.cameraVideo.srcObject as MediaStream).active;
        if (streamActive && this.cameraVideo.readyState >= 2) {
          ctx.drawImage(this.cameraVideo, x, y, width, height);
        } else {
          // Sleek OBS camera standby box
          ctx.fillStyle = '#14171d';
          ctx.fillRect(x, y, width, height);
          ctx.strokeStyle = '#252a34';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          // Icon & message
          ctx.fillStyle = '#64748b';
          ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('📷 WEBCAM INACTIVE', x + width / 2, y + height / 2 - 10);
          ctx.font = '400 16px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#475569';
          ctx.fillText('Click "Enable Camera" in top/audio panel to connect', x + width / 2, y + height / 2 + 24);
        }
        break;
      }

      case 'screen': {
        const screenActive = this.screenVideo.srcObject && (this.screenVideo.srcObject as MediaStream).active;
        if (screenActive && this.screenVideo.readyState >= 2) {
          ctx.drawImage(this.screenVideo, x, y, width, height);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x, y, width, height);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🖥️ DISPLAY / SCREEN SHARE', x + width / 2, y + height / 2 - 10);
          ctx.font = '400 16px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText('Click "Share Screen" in Sources to select a window or monitor', x + width / 2, y + height / 2 + 24);
        }
        break;
      }

      case 'color': {
        ctx.fillStyle = config.color || '#1e293b';
        ctx.fillRect(x, y, width, height);
        break;
      }

      case 'image': {
        if (config.imageUrl) {
          const img = this.getImage(config.imageUrl);
          if (img) {
            ctx.drawImage(img, x, y, width, height);
          } else {
            // Placeholder while image is loading
            ctx.fillStyle = '#1e2229';
            ctx.fillRect(x, y, width, height);
          }
        }
        break;
      }

      case 'video': {
        if (config.mediaUrl) {
          const video = this.getOrCreateVideoElement(source.id, config.mediaUrl, config.loop ?? true, config.volume ?? 1);
          if (video && video.readyState >= 2) {
            ctx.drawImage(video, x, y, width, height);
          } else {
            ctx.fillStyle = '#18181b';
            ctx.fillRect(x, y, width, height);
            ctx.fillStyle = '#a1a1aa';
            ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('▶ MEDIA PLAYER STANDBY', x + width / 2, y + height / 2);
          }
        } else {
          ctx.fillStyle = '#111827';
          ctx.fillRect(x, y, width, height);
          ctx.fillStyle = '#6b7280';
          ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🎞️ No media file loaded', x + width / 2, y + height / 2);
        }
        break;
      }

      case 'text': {
        if (config.backgroundColor && config.backgroundColor !== 'transparent') {
          ctx.fillStyle = config.backgroundColor;
          ctx.fillRect(x, y, width, height);
        }
        ctx.fillStyle = config.textColor || '#ffffff';
        const fontSize = config.fontSize || 24;
        const weight = config.fontWeight || 'bold';
        ctx.font = `${weight} ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = config.textAlign || 'left';
        ctx.textBaseline = 'middle';

        const padding = config.padding || 12;
        let textX = x + padding;
        if (config.textAlign === 'center') textX = x + width / 2;
        if (config.textAlign === 'right') textX = x + width - padding;

        const textY = y + height / 2;
        ctx.fillText(config.text || 'Sample Text', textX, textY);
        break;
      }

      case 'lowerthird': {
        const name = config.presenterName || 'Presenter Name';
        const role = config.presenterRole || 'Broadcaster / Host';
        const accent = config.accentColor || '#3b82f6';

        // Outer container with subtle backdrop blur & dark glass fill
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(x, y, width, height);

        // Accent strip on left
        ctx.fillStyle = accent;
        ctx.fillRect(x, y, 8, height);

        // Top decorative line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x + 8, y, width - 8, 1);

        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(name, x + 24, y + 16);

        // Role / Title
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(role, x + 24, y + 54);

        // Live badge on right edge of lowerthird
        ctx.fillStyle = accent;
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('LIVE HOST', x + width - 20, y + 20);
        break;
      }

      case 'ticker': {
        const text = config.tickerText || '🔴 Live Broadcast with LiveStudio PH';
        const speed = (config.tickerSpeed || 3) * 60; // pixels per second
        const bgColor = config.tickerBgColor || 'rgba(15, 23, 42, 0.9)';
        const textColor = config.tickerTextColor || '#f8fafc';

        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, width, height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(x, y, width, 1);

        ctx.fillStyle = textColor;
        ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(text);
        const textWidth = metrics.width + 120; // with space gap
        const offset = (elapsedSeconds * speed) % textWidth;

        // Clip to ticker bounds
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        // Draw multiple times to make it seamless
        const startX = x - offset;
        for (let drawX = startX; drawX < x + width + textWidth; drawX += textWidth) {
          ctx.fillText(text, drawX, y + height / 2);
        }
        ctx.restore();
        break;
      }

      case 'countdown': {
        const durationMins = config.durationMinutes || 5;
        const totalDurationSec = durationMins * 60;
        const remainingSec = Math.max(0, Math.floor(totalDurationSec - elapsedSeconds));

        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        const timeString = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Label above
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(config.countdownLabel || 'BROADCAST STARTS IN', x + width / 2, y + 14);

        // Big countdown digits
        if (remainingSec > 0) {
          ctx.fillStyle = config.textColor || '#60a5fa';
          ctx.font = '700 52px "JetBrains Mono", monospace';
          ctx.fillText(timeString, x + width / 2, y + 38);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(config.countdownCompletedText || 'WE ARE LIVE NOW!', x + width / 2, y + 48);
        }
        break;
      }

      case 'browser': {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x, y, width, height);

        // Title bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, width, 32);

        // Three window dots
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x + 32, y + 16, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x + 48, y + 16, 5, 0, Math.PI * 2);
        ctx.fill();

        // URL display in header
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.browserUrl || 'https://facebook.com/LiveStudioPH', x + 68, y + 16);

        // Body content
        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(config.browserTitle || 'Browser Source Active', x + width / 2, y + height / 2 - 10);
        ctx.fillStyle = '#64748b';
        ctx.font = '400 14px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Custom HTML & CSS widget ready for live overlays', x + width / 2, y + height / 2 + 20);
        break;
      }
    }
  }

  private renderSelectionOutline(source: SourceItem) {
    const ctx = this.ctx;
    const { x, y, width, height } = source;

    // OBS Studio red selection border
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);

    // 8 handles
    const handleSize = 8;
    const halfH = handleSize / 2;
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    const points = [
      { x, y }, // Top-left
      { x: x + width / 2, y }, // Top-mid
      { x: x + width, y }, // Top-right
      { x: x + width, y: y + height / 2 }, // Mid-right
      { x: x + width, y: y + height }, // Bot-right
      { x: x + width / 2, y: y + height }, // Bot-mid
      { x, y: y + height }, // Bot-left
      { x, y: y + height / 2 } // Mid-left
    ];

    for (const p of points) {
      ctx.fillRect(p.x - halfH, p.y - halfH, handleSize, handleSize);
      ctx.strokeRect(p.x - halfH, p.y - halfH, handleSize, handleSize);
    }
  }

  private renderSafeMargins(width: number, height: number) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // 90% Action Safe
    const aX = width * 0.05;
    const aY = height * 0.05;
    const aW = width * 0.9;
    const aH = height * 0.9;
    ctx.strokeRect(aX, aY, aW, aH);

    // 80% Title Safe
    const tX = width * 0.1;
    const tY = height * 0.1;
    const tW = width * 0.8;
    const tH = height * 0.8;
    ctx.strokeRect(tX, tY, tW, tH);

    ctx.setLineDash([]);
  }

  public captureStream(fps: number = 30): MediaStream {
    return this.canvas.captureStream(fps);
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.videoElements.forEach(v => {
      v.pause();
      v.src = '';
    });
    this.videoElements.clear();
    this.imageCache.clear();
  }
}
