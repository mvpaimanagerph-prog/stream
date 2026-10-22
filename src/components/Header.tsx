/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Disc, 
  Settings, 
  FolderDown, 
  FolderUp, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Square, 
  HelpCircle,
  Video,
  Library,
  Layers,
  Sparkles
} from 'lucide-react';
import { StreamStatus, StreamTelemetry } from '../types/studio';
import { BroadcastService } from '../services/broadcastService';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenPlaylist: () => void;
  onOpenDiagnostics: () => void;
  onExportConfig: () => void;
  onImportConfig: () => void;
  isStudioMode: boolean;
  onToggleStudioMode: () => void;
  onStartStreaming: () => void;
  onStopStreaming: () => void;
  onToggleRecording: () => void;
  isRecording: boolean;
  streamStatus: StreamStatus;
  telemetry: StreamTelemetry;
  activeProfile: string;
  onSelectProfile: (name: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenPlaylist,
  onOpenDiagnostics,
  onExportConfig,
  onImportConfig,
  isStudioMode,
  onToggleStudioMode,
  onStartStreaming,
  onStopStreaming,
  onToggleRecording,
  isRecording,
  streamStatus,
  telemetry,
  activeProfile,
  onSelectProfile
}) => {
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isLive = streamStatus === 'live';
  const isConnecting = streamStatus === 'connecting';

  return (
    <header className="h-14 bg-[#14171d] border-b border-[#282d37] px-4 flex items-center justify-between gap-4 shrink-0 select-none">
      {/* Brand & Profile */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-inner">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">LiveStudio PH</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 font-semibold">
                OBS Engine
              </span>
            </div>
            <div className="text-[11px] text-[#848ea0] flex items-center gap-1.5">
              <span>Facebook Live Broadcast Suite</span>
            </div>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-[#282d37] hidden sm:block" />

        {/* Profile Selector */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#9aa4b6]">
          <span className="text-[#64748b]">Profile:</span>
          <select 
            value={activeProfile}
            onChange={(e) => onSelectProfile(e.target.value)}
            className="bg-[#1c2027] border border-[#2d3441] text-xs text-white rounded px-2 py-1 outline-none hover:border-blue-500/50 focus:border-blue-500"
          >
            <option value="Main Facebook Live">Main Facebook Live</option>
            <option value="Gaming & Esports">Gaming & Esports</option>
            <option value="Podcast & Talk Show">Podcast & Talk Show</option>
            <option value="Mobile Vertical 9:16">Mobile Vertical (Reels/Live)</option>
          </select>
        </div>
      </div>

      {/* Stream Metrics / Telemetry */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-mono tabular-nums">
        <div className="flex items-center gap-2 px-3 py-1 bg-[#1a1e26] border border-[#282e3b] rounded">
          <span className="text-[#64748b] text-[11px] font-sans">LIVE:</span>
          <span className={`font-semibold ${isLive ? 'text-red-400' : 'text-[#848ea0]'}`}>
            {formatTime(telemetry.uptimeSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 bg-[#1a1e26] border border-[#282e3b] rounded text-[#848ea0]">
          <div>
            <span className="text-[#64748b] text-[11px] font-sans mr-1">FPS:</span>
            <span className={telemetry.actualFps > 0 ? 'text-green-400 font-semibold' : 'text-[#64748b]'}>
              {telemetry.actualFps}
            </span>
          </div>
          <span className="text-[#2d3441]">|</span>
          <div>
            <span className="text-[#64748b] text-[11px] font-sans mr-1">KBPS:</span>
            <span className={telemetry.currentKbps > 0 ? 'text-green-400 font-semibold' : 'text-[#64748b]'}>
              {telemetry.currentKbps}
            </span>
          </div>
          <span className="text-[#2d3441]">|</span>
          <div>
            <span className="text-[#64748b] text-[11px] font-sans mr-1">CPU:</span>
            <span className="text-white font-semibold">
              {telemetry.cpuLoadEstimate}%
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls & Modal Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Studio Mode Toggle */}
        <button
          onClick={onToggleStudioMode}
          title="Toggle Studio Mode (Preview vs Program)"
          className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors border ${
            isStudioMode 
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' 
              : 'bg-[#1b1f27] text-[#9aa4b6] border-[#2c323f] hover:text-white hover:border-[#3d4556]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Studio Mode</span>
        </button>

        {/* Media Playlist Modal */}
        <button
          onClick={onOpenPlaylist}
          title="Media Library & Playlist"
          className="px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 bg-[#1b1f27] text-[#9aa4b6] border border-[#2c323f] hover:text-white hover:border-[#3d4556] transition-colors"
        >
          <Library className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Media Playlist</span>
        </button>

        {/* Test Suite / Diagnostics */}
        <button
          onClick={onOpenDiagnostics}
          title="Run OBS Engine Automated Verification Suite"
          className="px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 bg-[#1b1f27] text-[#9aa4b6] border border-[#2c323f] hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Test Suite</span>
        </button>

        {/* Stream Settings */}
        <button
          onClick={onOpenSettings}
          title="Streaming & Facebook Live Settings"
          className="px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 bg-[#1b1f27] text-[#9aa4b6] border border-[#2c323f] hover:text-white hover:border-[#3d4556] transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </button>

        <div className="h-6 w-[1px] bg-[#282d37]" />

        {/* Record Button */}
        <button
          onClick={onToggleRecording}
          title={isRecording ? 'Stop Recording and Save Video File' : 'Record Broadcast Locally'}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            isRecording
              ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
              : 'bg-[#202530] text-[#cbd5e1] border border-[#31394a] hover:bg-[#282f3d] hover:text-white'
          }`}
        >
          <Disc className={`w-3.5 h-3.5 ${isRecording ? 'text-white' : 'text-amber-400'}`} />
          <span>{isRecording ? 'Stop Rec' : 'Record'}</span>
        </button>

        {/* Start / Stop Streaming Primary Button */}
        {isLive ? (
          <button
            onClick={onStopStreaming}
            className="px-4 py-1.5 rounded text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>End Live</span>
          </button>
        ) : (
          <button
            onClick={onStartStreaming}
            disabled={isConnecting}
            className="px-4 py-1.5 rounded text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-lg shadow-red-950/40 transition-all disabled:opacity-50"
          >
            <Radio className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
            <span>{isConnecting ? 'Connecting...' : 'Go Live'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
