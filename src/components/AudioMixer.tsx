/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  MonitorSpeaker, 
  Sliders, 
  AlertCircle,
  Settings,
  Headphones,
  Check
} from 'lucide-react';
import { AudioChannel } from '../types/studio';
import { MediaService, DeviceInfo } from '../services/mediaService';

interface AudioMixerProps {
  channels: AudioChannel[];
  onUpdateVolume: (id: string, volume: number) => void;
  onToggleMute: (id: string) => void;
  microphones: DeviceInfo[];
  selectedMicId: string;
  onSelectMic: (deviceId: string) => void;
  isMicActive: boolean;
  onRequestMicPermission: () => void;
  micPermissionError?: string;
}

export const AudioMixer: React.FC<AudioMixerProps> = ({
  channels,
  onUpdateVolume,
  onToggleMute,
  microphones,
  selectedMicId,
  onSelectMic,
  isMicActive,
  onRequestMicPermission,
  micPermissionError
}) => {
  // Live meter levels
  const [micLevel, setMicLevel] = useState<{ rms: number; peak: number }>({ rms: 0, peak: 0 });
  const [mediaLevel, setMediaLevel] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Poll Web Audio levels in sync with screen refresh
  useEffect(() => {
    const updateMeters = () => {
      if (isMicActive) {
        const live = MediaService.getMicLevels();
        setMicLevel(live);
      } else {
        setMicLevel({ rms: 0, peak: 0 });
      }

      // Simulated gentle ambient flutter for media when active
      setMediaLevel(prev => (prev > 0.05 ? prev * 0.95 : 0));

      animFrameRef.current = requestAnimationFrame(updateMeters);
    };

    animFrameRef.current = requestAnimationFrame(updateMeters);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isMicActive]);

  const getDbFromVolume = (vol: number): string => {
    if (vol <= 0.001) return '-inf dB';
    const db = Math.round(20 * Math.log10(vol));
    return `${db > 0 ? '+' : ''}${db} dB`;
  };

  const renderMeter = (level: number, peak: number, muted: boolean) => {
    const effectiveLevel = muted ? 0 : Math.min(1, level);
    const effectivePeak = muted ? 0 : Math.min(1, peak);

    return (
      <div className="relative w-full h-2.5 bg-[#101318] rounded-sm overflow-hidden border border-[#212631]">
        {/* Color segments: Green (-60 to -18dB) -> Yellow (-18 to -6dB) -> Red (-6 to 0dB) */}
        <div 
          className="h-full transition-all duration-75 ease-out rounded-sm"
          style={{
            width: `${effectiveLevel * 100}%`,
            background: 'linear-gradient(to right, #10b981 0%, #10b981 65%, #f59e0b 80%, #ef4444 100%)'
          }}
        />

        {/* Peak Line */}
        {effectivePeak > 0.05 && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm"
            style={{ left: `${effectivePeak * 100}%` }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="h-44 bg-[#14171d] border-t border-[#282d37] px-4 py-2.5 flex flex-col select-none shrink-0">
      {/* Title Bar & Mic Device Selector */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#242932]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#cbd5e1]">Audio Mixer</span>
        </div>

        {/* Microphone hardware status & device picker */}
        <div className="flex items-center gap-2 text-xs">
          {micPermissionError ? (
            <div className="flex items-center gap-1.5 text-rose-400 text-[11px] bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/60">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{micPermissionError}</span>
              <button 
                onClick={onRequestMicPermission}
                className="underline font-semibold ml-1 hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : !isMicActive ? (
            <button
              onClick={onRequestMicPermission}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600 hover:text-white transition-all text-[11px] font-semibold"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Enable Microphone Hardware</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#64748b]">Input Device:</span>
              <select
                value={selectedMicId}
                onChange={(e) => onSelectMic(e.target.value)}
                className="bg-[#1c2028] border border-[#2d3442] text-[11px] text-[#e2e8f0] rounded px-2 py-1 outline-none hover:border-emerald-500/50"
              >
                {microphones.length > 0 ? (
                  microphones.map(m => (
                    <option key={m.deviceId} value={m.deviceId}>
                      {m.label}
                    </option>
                  ))
                ) : (
                  <option value="">Default System Microphone</option>
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4 Channel Fader Strips Grid */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch">
        {channels.map((channel) => {
          const isMic = channel.type === 'mic';
          const currentLevel = isMic ? micLevel.rms * channel.volume : channel.volume * 0.25;
          const currentPeak = isMic ? micLevel.peak * channel.volume : channel.volume * 0.35;

          return (
            <div
              key={channel.id}
              className="bg-[#181b22] border border-[#252b36] rounded-lg p-2.5 flex flex-col justify-between hover:border-[#353d4c] transition-all"
            >
              {/* Channel Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 truncate">
                  {isMic ? (
                    <Mic className={`w-3.5 h-3.5 ${isMicActive ? 'text-emerald-400' : 'text-[#64748b]'}`} />
                  ) : (
                    <MonitorSpeaker className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span className="text-xs font-semibold text-[#cbd5e1] truncate">{channel.name}</span>
                </div>

                <span className="text-[10px] font-mono tabular-nums text-[#848ea0]">
                  {getDbFromVolume(channel.volume)}
                </span>
              </div>

              {/* Real-time Level Meter */}
              <div className="my-1">
                {renderMeter(currentLevel, currentPeak, channel.muted || (isMic && !isMicActive))}
              </div>

              {/* Fader & Mute Row */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={channel.volume}
                  onChange={(e) => onUpdateVolume(channel.id, parseFloat(e.target.value))}
                  disabled={channel.muted}
                  className="fader flex-1 cursor-pointer disabled:opacity-40"
                />

                {/* Mute Button */}
                <button
                  onClick={() => onToggleMute(channel.id)}
                  title={channel.muted ? 'Unmute Channel' : 'Mute Channel'}
                  className={`p-1.5 rounded transition-all ${
                    channel.muted
                      ? 'bg-red-600 text-white shadow-inner'
                      : 'bg-[#222731] text-[#9aa4b6] hover:text-white hover:bg-[#2c3340]'
                  }`}
                >
                  {channel.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Status footer for channel */}
              <div className="mt-1 flex items-center justify-between text-[10px] text-[#64748b] font-mono">
                <span>{channel.muted ? 'MUTED' : isMic && !isMicActive ? 'STANDBY' : 'ACTIVE'}</span>
                <span>{Math.round(channel.volume * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
