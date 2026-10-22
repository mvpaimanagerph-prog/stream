/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Maximize2, 
  Eye, 
  Grid, 
  Crop, 
  RotateCw, 
  Sparkles,
  ArrowRightLeft,
  Ratio,
  Maximize,
  Minimize
} from 'lucide-react';
import { SourceItem, AspectRatio, Resolution } from '../types/studio';
import { CanvasRenderer } from '../services/canvasRenderer';

interface PreviewCanvasProps {
  sources: SourceItem[];
  programSources: SourceItem[];
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  onUpdateSource: (id: string, updates: Partial<SourceItem>) => void;
  isStudioMode: boolean;
  onTransition: () => void;
  cameraStream: MediaStream | null;
  screenStream: MediaStream | null;
  onCanvasStreamReady: (stream: MediaStream) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  sources,
  programSources,
  selectedSourceId,
  onSelectSource,
  onUpdateSource,
  isStudioMode,
  onTransition,
  cameraStream,
  screenStream,
  onCanvasStreamReady
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const programCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const previewRendererRef = useRef<CanvasRenderer | null>(null);
  const programRendererRef = useRef<CanvasRenderer | null>(null);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [showSafeMargins, setShowSafeMargins] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Dragging & Resizing State in Preview Canvas
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; sourceX: number; sourceY: number; w: number; h: number } | null>(null);

  // Compute Base Canvas Resolution
  const getCanvasDimensions = useCallback((ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9': return { width: 1920, height: 1080 };
      case '9:16': return { width: 1080, height: 1920 };
      case '4:3':  return { width: 1440, height: 1080 };
      case '1:1':  return { width: 1080, height: 1080 };
    }
  }, []);

  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(aspectRatio);

  // Initialize and keep Canvas Renderers updated
  useEffect(() => {
    if (previewCanvasRef.current && !previewRendererRef.current) {
      previewRendererRef.current = new CanvasRenderer(previewCanvasRef.current);
    }
    if (programCanvasRef.current && !programRendererRef.current) {
      programRendererRef.current = new CanvasRenderer(programCanvasRef.current);
      // Give program canvas stream to broadcast service
      const stream = programRendererRef.current.captureStream(30);
      onCanvasStreamReady(stream);
    } else if (previewCanvasRef.current && !isStudioMode && previewRendererRef.current) {
      // In single mode, preview canvas is also program stream
      const stream = previewRendererRef.current.captureStream(30);
      onCanvasStreamReady(stream);
    }
  }, [isStudioMode, onCanvasStreamReady]);

  // Pass Camera and Screen streams to renderers
  useEffect(() => {
    if (previewRendererRef.current) {
      previewRendererRef.current.setCameraStream(cameraStream);
      previewRendererRef.current.setScreenStream(screenStream);
    }
    if (programRendererRef.current) {
      programRendererRef.current.setCameraStream(cameraStream);
      programRendererRef.current.setScreenStream(screenStream);
    }
  }, [cameraStream, screenStream]);

  // Main render animation loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (previewRendererRef.current && previewCanvasRef.current) {
        previewRendererRef.current.render(sources, selectedSourceId, showSafeMargins, aspectRatio);
      }
      if (isStudioMode && programRendererRef.current && programCanvasRef.current) {
        programRendererRef.current.render(programSources, null, false, aspectRatio);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [sources, programSources, selectedSourceId, showSafeMargins, aspectRatio, isStudioMode]);

  // Mouse to Canvas coordinate conversion
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Pointer interactions for dragging and resizing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    // If source is selected and unlocked, check if clicked on corner handles
    if (selectedSourceId) {
      const selected = sources.find(s => s.id === selectedSourceId);
      if (selected && !selected.locked) {
        const handleHit = checkHandleHit(x, y, selected);
        if (handleHit) {
          setIsDragging(true);
          setDragHandle(handleHit);
          setDragStart({ x, y, sourceX: selected.x, sourceY: selected.y, w: selected.width, h: selected.height });
          return;
        }

        // Check if clicked inside selected source body
        if (x >= selected.x && x <= selected.x + selected.width && y >= selected.y && y <= selected.y + selected.height) {
          setIsDragging(true);
          setDragHandle('body');
          setDragStart({ x, y, sourceX: selected.x, sourceY: selected.y, w: selected.width, h: selected.height });
          return;
        }
      }
    }

    // Hit test sources in descending zIndex order
    const sorted = [...sources].filter(s => s.visible).sort((a, b) => b.zIndex - a.zIndex);
    const clickedSource = sorted.find(s => x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height);

    if (clickedSource) {
      onSelectSource(clickedSource.id);
      if (!clickedSource.locked) {
        setIsDragging(true);
        setDragHandle('body');
        setDragStart({ x, y, sourceX: clickedSource.x, sourceY: clickedSource.y, w: clickedSource.width, h: clickedSource.height });
      }
    } else {
      onSelectSource(null);
    }
  };

  const checkHandleHit = (px: number, py: number, source: SourceItem): string | null => {
    const radius = 24; // generous hit radius
    const { x, y, width: w, height: h } = source;
    if (Math.hypot(px - x, py - y) < radius) return 'top-left';
    if (Math.hypot(px - (x + w), py - y) < radius) return 'top-right';
    if (Math.hypot(px - (x + w), py - (y + h)) < radius) return 'bot-right';
    if (Math.hypot(px - x, py - (y + h)) < radius) return 'bot-left';
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !selectedSourceId) return;
    const { x, y } = getCanvasCoords(e);
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    if (dragHandle === 'body') {
      onUpdateSource(selectedSourceId, {
        x: Math.round(dragStart.sourceX + dx),
        y: Math.round(dragStart.sourceY + dy)
      });
    } else if (dragHandle === 'bot-right') {
      onUpdateSource(selectedSourceId, {
        width: Math.max(40, Math.round(dragStart.w + dx)),
        height: Math.max(40, Math.round(dragStart.h + dy))
      });
    } else if (dragHandle === 'bot-left') {
      const newWidth = Math.max(40, Math.round(dragStart.w - dx));
      onUpdateSource(selectedSourceId, {
        x: Math.round(dragStart.sourceX + (dragStart.w - newWidth)),
        width: newWidth,
        height: Math.max(40, Math.round(dragStart.h + dy))
      });
    } else if (dragHandle === 'top-right') {
      const newHeight = Math.max(40, Math.round(dragStart.h - dy));
      onUpdateSource(selectedSourceId, {
        y: Math.round(dragStart.sourceY + (dragStart.h - newHeight)),
        width: Math.max(40, Math.round(dragStart.w + dx)),
        height: newHeight
      });
    } else if (dragHandle === 'top-left') {
      const newWidth = Math.max(40, Math.round(dragStart.w - dx));
      const newHeight = Math.max(40, Math.round(dragStart.h - dy));
      onUpdateSource(selectedSourceId, {
        x: Math.round(dragStart.sourceX + (dragStart.w - newWidth)),
        y: Math.round(dragStart.sourceY + (dragStart.h - newHeight)),
        width: newWidth,
        height: newHeight
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragHandle(null);
    setDragStart(null);
  };

  // Quick alignment helpers
  const handleFitToScreen = () => {
    if (!selectedSourceId) return;
    onUpdateSource(selectedSourceId, {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight
    });
  };

  const handleCenter = () => {
    if (!selectedSourceId) return;
    const selected = sources.find(s => s.id === selectedSourceId);
    if (!selected) return;
    onUpdateSource(selectedSourceId, {
      x: Math.round((canvasWidth - selected.width) / 2),
      y: Math.round((canvasHeight - selected.height) / 2)
    });
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full bg-[#0b0d11] select-none overflow-hidden relative">
      {/* Top Preview Toolbar */}
      <div className="h-9 px-3 bg-[#14171d] border-b border-[#242932] flex items-center justify-between text-xs text-[#9aa4b6] shrink-0">
        <div className="flex items-center gap-3">
          {/* Resolution & Ratio badges */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-[#64748b]">CANVAS:</span>
            <span className="text-white font-semibold">{canvasWidth}x{canvasHeight}</span>
            <span className="text-[#3b82f6] font-semibold">({aspectRatio})</span>
          </div>

          <div className="h-4 w-[1px] bg-[#282d37]" />

          {/* Aspect Ratio Switcher */}
          <div className="flex items-center gap-1 text-[11px]">
            {(['16:9', '9:16', '4:3', '1:1'] as AspectRatio[]).map((r) => (
              <button
                key={r}
                onClick={() => setAspectRatio(r)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  aspectRatio === r ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-[#202530] text-[#9aa4b6]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-[#282d37] hidden sm:block" />

          {/* Guides Toggle */}
          <button
            onClick={() => setShowSafeMargins(!showSafeMargins)}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors ${
              showSafeMargins ? 'bg-sky-950/70 text-sky-400 border border-sky-800' : 'hover:bg-[#202530] text-[#9aa4b6]'
            }`}
            title="Toggle Action & Title Safe Margins"
          >
            <Grid className="w-3 h-3" />
            <span className="hidden md:inline">Safe Guides</span>
          </button>
        </div>

        {/* Right side alignment tools & fullscreen */}
        <div className="flex items-center gap-2">
          {selectedSourceId && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleFitToScreen}
                title="Fit Selected Source to Canvas"
                className="px-2 py-0.5 rounded bg-[#1e232d] hover:bg-blue-600 hover:text-white text-[11px] text-[#cbd5e1] transition-colors"
              >
                Fit Screen
              </button>
              <button
                onClick={handleCenter}
                title="Center Selected Source"
                className="px-2 py-0.5 rounded bg-[#1e232d] hover:bg-blue-600 hover:text-white text-[11px] text-[#cbd5e1] transition-colors"
              >
                Center
              </button>
            </div>
          )}

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                containerRef.current?.requestFullscreen().catch(() => {});
                setIsFullscreen(true);
              } else {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
              }
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
            className="p-1 rounded text-[#9aa4b6] hover:text-white hover:bg-[#202530]"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Viewport: Single Canvas OR Dual Studio Mode */}
      <div className="flex-1 flex items-center justify-center p-3 overflow-hidden bg-[#0a0c10]">
        {isStudioMode ? (
          /* Dual Studio Mode: Preview (Left) -> Transition Button -> Program (Right) */
          <div className="w-full h-full flex items-center justify-center gap-4">
            {/* Left: Preview Canvas */}
            <div className="flex-1 flex flex-col h-full items-center justify-center">
              <div className="w-full max-w-[640px] flex items-center justify-between mb-1.5 px-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  PREVIEW (EDITING)
                </span>
                <span className="text-[10px] text-[#64748b]">Click & drag to position</span>
              </div>
              <div className="relative border border-[#2d3545] rounded shadow-2xl bg-black max-w-full max-h-[calc(100%-2rem)] flex items-center justify-center overflow-hidden">
                <canvas
                  ref={previewCanvasRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="max-w-full max-h-full object-contain cursor-crosshair"
                />
              </div>
            </div>

            {/* Center Transition Button */}
            <div className="flex flex-col items-center justify-center gap-2 shrink-0">
              <button
                onClick={onTransition}
                className="px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex flex-col items-center gap-1 active:scale-95 transition-all"
                title="Cut / Fade Preview to Program"
              >
                <ArrowRightLeft className="w-5 h-5" />
                <span>Cut</span>
              </button>
              <span className="text-[10px] font-mono text-[#64748b]">AUTO TRANSITION</span>
            </div>

            {/* Right: Program Canvas (Live Output) */}
            <div className="flex-1 flex flex-col h-full items-center justify-center">
              <div className="w-full max-w-[640px] flex items-center justify-between mb-1.5 px-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-500 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  PROGRAM (LIVE STREAM)
                </span>
                <span className="text-[10px] text-red-400/80 font-mono">ON AIR</span>
              </div>
              <div className="relative border border-red-950/60 rounded shadow-2xl bg-black max-w-full max-h-[calc(100%-2rem)] flex items-center justify-center overflow-hidden">
                <canvas
                  ref={programCanvasRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Single Master Canvas Mode */
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <div className="relative border border-[#242a35] rounded-lg shadow-2xl bg-black max-w-full max-h-full flex items-center justify-center overflow-hidden">
              <canvas
                ref={previewCanvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="max-w-full max-h-full object-contain cursor-crosshair"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
