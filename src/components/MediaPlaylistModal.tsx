/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Film, 
  Music, 
  Image as ImageIcon, 
  Volume2, 
  Check, 
  Plus, 
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { MediaItem } from '../types/studio';

interface MediaPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  onAddMedia: (item: MediaItem) => void;
  onDeleteMedia: (id: string) => void;
  onReorderMedia: (id: string, direction: 'up' | 'down') => void;
  onApplyToCurrentScene: (media: MediaItem) => void;
}

export const MediaPlaylistModal: React.FC<MediaPlaylistModalProps> = ({
  isOpen,
  onClose,
  mediaItems,
  onAddMedia,
  onDeleteMedia,
  onReorderMedia,
  onApplyToCurrentScene
}) => {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(mediaItems[0] || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      let type: 'video' | 'audio' | 'image' = 'video';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const newItem: MediaItem = {
        id: `media_${Date.now()}_${i}`,
        name: file.name,
        type,
        url,
        size: file.size
      };

      onAddMedia(newItem);
      if (!selectedItem) setSelectedItem(newItem);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#14171d] border border-[#2a303c] rounded-xl w-full max-w-4xl h-[620px] flex flex-col shadow-2xl overflow-hidden select-none">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#181b22] border-b border-[#242932] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Studio Media Library & Playlist</h2>
              <p className="text-[11px] text-[#848ea0]">Manage video clips, music bumpers, logos, and intermission loops</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split into Playlist List (Left) and Media Player / Preview (Right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Playlist items */}
          <div className="w-80 border-r border-[#242932] flex flex-col bg-[#121419]">
            <div className="p-3 border-b border-[#242932] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider">
                Library ({mediaItems.length})
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,audio/*,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import File</span>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {mediaItems.map((item, idx) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setIsPlaying(false);
                      setCurrentTime(0);
                    }}
                    className={`p-2 rounded text-xs flex items-center justify-between cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500/60 text-white'
                        : 'border-transparent text-[#9aa4b6] hover:bg-[#1a1e27] hover:text-[#e2e8f0]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate mr-1">
                      {item.type === 'video' && <Film className="w-4 h-4 text-purple-400 shrink-0" />}
                      {item.type === 'audio' && <Music className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {item.type === 'image' && <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />}
                      <span className="truncate font-medium">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={idx === 0}
                        onClick={() => onReorderMedia(item.id, 'up')}
                        className="p-1 text-[#64748b] hover:text-white disabled:opacity-20"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={idx === mediaItems.length - 1}
                        onClick={() => onReorderMedia(item.id, 'down')}
                        className="p-1 text-[#64748b] hover:text-white disabled:opacity-20"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {!item.isBuiltin && (
                        <button
                          onClick={() => onDeleteMedia(item.id)}
                          className="p-1 text-[#64748b] hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Codec support guidance */}
            <div className="p-3 bg-[#0d0f13] border-t border-[#20252e] text-[11px] text-[#64748b]">
              <div className="font-semibold text-[#848ea0] mb-0.5">Compatible Formats:</div>
              <span>H.264 MP4, WebM (VP8/VP9), MP3, WAV, PNG, SVG. Large 4K files may impact browser performance.</span>
            </div>
          </div>

          {/* Right Column: Media Preview Player */}
          <div className="flex-1 flex flex-col p-4 bg-[#14171d] justify-between">
            {selectedItem ? (
              <div className="flex-1 flex flex-col justify-between">
                {/* Media Screen Box */}
                <div className="flex-1 bg-black rounded-lg border border-[#252b36] flex items-center justify-center overflow-hidden relative">
                  {selectedItem.type === 'video' ? (
                    <video
                      ref={videoRef}
                      src={selectedItem.url}
                      loop={isLooping}
                      onTimeUpdate={() => {
                        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current) setDuration(videoRef.current.duration);
                      }}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : selectedItem.type === 'image' ? (
                    <img
                      src={selectedItem.url}
                      alt={selectedItem.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-emerald-400 gap-3">
                      <Music className="w-16 h-16 animate-pulse" />
                      <span className="text-sm font-semibold text-white">{selectedItem.name}</span>
                      <audio
                        src={selectedItem.url}
                        controls
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>

                {/* Video / Audio playback controls */}
                {selectedItem.type === 'video' && (
                  <div className="mt-3 bg-[#181b22] border border-[#252b36] rounded-lg p-3 space-y-2">
                    {/* Seek Slider */}
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span>{formatSeconds(currentTime)}</span>
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        className="fader flex-1"
                      />
                      <span>{formatSeconds(duration)}</span>
                    </div>

                    {/* Button row */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={togglePlay}
                          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{isPlaying ? 'Pause' : 'Play'}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = 0;
                              setCurrentTime(0);
                            }
                          }}
                          className="p-1.5 rounded bg-[#202530] text-[#9aa4b6] hover:text-white"
                          title="Restart"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        <label className="flex items-center gap-1.5 text-xs text-[#9aa4b6] ml-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isLooping}
                            onChange={(e) => setIsLooping(e.target.checked)}
                            className="rounded bg-[#202530]"
                          />
                          <span>Loop Video</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-[#64748b]" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={volume}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setVolume(val);
                            if (videoRef.current) videoRef.current.volume = val;
                          }}
                          className="fader w-24"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer action */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-[#848ea0] truncate max-w-sm">
                    Selected: <strong className="text-white">{selectedItem.name}</strong>
                  </div>

                  <button
                    onClick={() => {
                      onApplyToCurrentScene(selectedItem);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Insert into Current Scene</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#64748b]">
                Select a media item from the list to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
