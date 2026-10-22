/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Settings2,
  Video, 
  Monitor, 
  Film, 
  Image as ImageIcon, 
  Type, 
  Layers, 
  Timer, 
  Palette, 
  Globe,
  Radio,
  Sliders,
  AlignLeft
} from 'lucide-react';
import { SourceItem, SourceType } from '../types/studio';

interface SourcesPanelProps {
  sources: SourceItem[];
  selectedSourceId: string | null;
  onSelectSource: (id: string) => void;
  onAddSource: (type: SourceType) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDuplicateSource: (id: string) => void;
  onDeleteSource: (id: string) => void;
  onMoveSourceOrder: (id: string, direction: 'up' | 'down') => void;
  onConfigureSource: (source: SourceItem) => void;
  onEnableCamera: () => void;
  onShareScreen: () => void;
  isCameraActive: boolean;
  isScreenActive: boolean;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  sources,
  selectedSourceId,
  onSelectSource,
  onAddSource,
  onToggleVisibility,
  onToggleLock,
  onDuplicateSource,
  onDeleteSource,
  onMoveSourceOrder,
  onConfigureSource,
  onEnableCamera,
  onShareScreen,
  isCameraActive,
  isScreenActive
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Sources sorted by zIndex descending (top-most layer on top in OBS UI)
  const sortedSources = [...sources].sort((a, b) => b.zIndex - a.zIndex);

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'webcam': return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case 'screen': return <Monitor className="w-3.5 h-3.5 text-emerald-400" />;
      case 'video': return <Film className="w-3.5 h-3.5 text-purple-400" />;
      case 'image': return <ImageIcon className="w-3.5 h-3.5 text-amber-400" />;
      case 'text': return <Type className="w-3.5 h-3.5 text-sky-400" />;
      case 'lowerthird': return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ticker': return <AlignLeft className="w-3.5 h-3.5 text-teal-400" />;
      case 'countdown': return <Timer className="w-3.5 h-3.5 text-rose-400" />;
      case 'color': return <Palette className="w-3.5 h-3.5 text-orange-400" />;
      case 'browser': return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const addOptions: { type: SourceType; label: string; icon: React.ReactNode; desc: string }[] = [
    { type: 'webcam', label: 'Video Capture Device (Camera)', icon: <Video className="w-4 h-4 text-blue-400" />, desc: 'Live webcam or capture card' },
    { type: 'screen', label: 'Screen / Display Capture', icon: <Monitor className="w-4 h-4 text-emerald-400" />, desc: 'Window, tab, or entire display' },
    { type: 'lowerthird', label: 'Host Lower-Third Banner', icon: <Layers className="w-4 h-4 text-indigo-400" />, desc: 'Presenter name & role graphics' },
    { type: 'ticker', label: 'News Ticker / Crawl', icon: <AlignLeft className="w-4 h-4 text-teal-400" />, desc: 'Scrolling announcements & alerts' },
    { type: 'countdown', label: 'Broadcast Countdown Timer', icon: <Timer className="w-4 h-4 text-rose-400" />, desc: 'Custom countdown for starting soon' },
    { type: 'text', label: 'Text Overlay', icon: <Type className="w-4 h-4 text-sky-400" />, desc: 'Custom text, titles, watermarks' },
    { type: 'image', label: 'Image / Channel Logo', icon: <ImageIcon className="w-4 h-4 text-amber-400" />, desc: 'PNG, JPG, SVG overlays' },
    { type: 'video', label: 'Media Source (Video/Clip)', icon: <Film className="w-4 h-4 text-purple-400" />, desc: 'Looping video backgrounds & stings' },
    { type: 'color', label: 'Color Background', icon: <Palette className="w-4 h-4 text-orange-400" />, desc: 'Solid color matte or canvas backdrop' },
    { type: 'browser', label: 'Browser Source / Overlay', icon: <Globe className="w-4 h-4 text-cyan-400" />, desc: 'Web page, alerts widget, chat box' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#14171d] border-l border-[#282d37] select-none relative">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#242932] flex items-center justify-between bg-[#181b22]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#cbd5e1]">Sources</span>
        </div>
        
        {/* Device Quick Connects */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEnableCamera}
            title={isCameraActive ? 'Camera Connected' : 'Connect Camera'}
            className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
              isCameraActive 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' 
                : 'bg-[#1f242d] text-[#848ea0] border-[#2e3543] hover:text-white'
            }`}
          >
            <Video className="w-3 h-3" />
            <span>{isCameraActive ? 'CAM ON' : 'CONNECT CAM'}</span>
          </button>

          <button
            onClick={onShareScreen}
            title={isScreenActive ? 'Screen Connected' : 'Share Screen'}
            className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
              isScreenActive 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' 
                : 'bg-[#1f242d] text-[#848ea0] border-[#2e3543] hover:text-white'
            }`}
          >
            <Monitor className="w-3 h-3" />
            <span>{isScreenActive ? 'SCREEN ON' : 'SHARE'}</span>
          </button>
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {sortedSources.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#64748b]">
            <Layers className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs font-medium text-[#94a3b8]">No sources in this scene</p>
            <p className="text-[11px] text-[#64748b] mt-1">Click the + button below to add webcam, screen share, overlays, or media.</p>
          </div>
        ) : (
          sortedSources.map((source) => {
            const isSelected = source.id === selectedSourceId;

            return (
              <div
                key={source.id}
                onClick={() => onSelectSource(source.id)}
                className={`group px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-blue-600/20 text-white border-blue-500/60 shadow-sm'
                    : 'text-[#9aa4b6] border-transparent hover:bg-[#1a1e27] hover:text-[#e2e8f0]'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 mr-2">
                  <span className="shrink-0">{getSourceIcon(source.type)}</span>
                  <span className={`truncate ${!source.visible ? 'line-through text-[#64748b]' : ''}`}>
                    {source.name}
                  </span>
                </div>

                {/* Source Item Controls */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => onToggleVisibility(source.id)}
                    title={source.visible ? 'Hide Source' : 'Show Source'}
                    className={`p-1 rounded hover:bg-[#252b36] transition-colors ${source.visible ? 'text-[#9aa4b6] hover:text-white' : 'text-[#64748b]'}`}
                  >
                    {source.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    onClick={() => onToggleLock(source.id)}
                    title={source.locked ? 'Unlock Position' : 'Lock Position'}
                    className={`p-1 rounded hover:bg-[#252b36] transition-colors ${source.locked ? 'text-amber-400' : 'text-[#64748b] hover:text-[#9aa4b6]'}`}
                  >
                    {source.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => onConfigureSource(source)}
                    title="Source Properties"
                    className="p-1 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36] transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* OBS-style bottom toolbar */}
      <div className="p-1.5 bg-[#181b22] border-t border-[#242932] flex items-center justify-between gap-1 relative">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            title="Add Source"
            className={`p-1.5 rounded transition-colors ${
              showAddMenu ? 'bg-blue-600 text-white' : 'text-[#9aa4b6] hover:text-white hover:bg-[#252b36]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            disabled={!selectedSourceId}
            onClick={() => selectedSourceId && onDeleteSource(selectedSourceId)}
            title="Delete Selected Source"
            className="p-1.5 rounded text-[#9aa4b6] hover:text-red-400 hover:bg-red-950/30 disabled:opacity-30 disabled:hover:text-[#9aa4b6] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            disabled={!selectedSourceId}
            onClick={() => selectedSourceId && onDuplicateSource(selectedSourceId)}
            title="Duplicate Selected Source"
            className="p-1.5 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36] disabled:opacity-30 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            disabled={!selectedSourceId}
            onClick={() => {
              const selected = sources.find(s => s.id === selectedSourceId);
              if (selected) onConfigureSource(selected);
            }}
            title="Source Properties"
            className="p-1.5 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36] disabled:opacity-30 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Order Up / Order Down */}
        <div className="flex items-center gap-1">
          <button
            disabled={!selectedSourceId}
            onClick={() => selectedSourceId && onMoveSourceOrder(selectedSourceId, 'up')}
            title="Move Layer Up (Bring Forward)"
            className="p-1.5 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36] disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!selectedSourceId}
            onClick={() => selectedSourceId && onMoveSourceOrder(selectedSourceId, 'down')}
            title="Move Layer Down (Send Backward)"
            className="p-1.5 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36] disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add Source Popup Menu */}
        {showAddMenu && (
          <div className="absolute bottom-11 left-1.5 w-64 bg-[#1c212b] border border-[#313947] rounded-lg shadow-2xl py-1.5 z-50 overflow-hidden">
            <div className="px-3 py-1 text-[11px] font-bold text-[#64748b] uppercase tracking-wider border-b border-[#282f3c] mb-1">
              Add New Source Layer
            </div>
            <div className="max-h-80 overflow-y-auto">
              {addOptions.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => {
                    onAddSource(opt.type);
                    setShowAddMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-blue-600/20 hover:text-white flex items-start gap-2.5 transition-colors group"
                >
                  <span className="mt-0.5">{opt.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-[#e2e8f0] group-hover:text-blue-300">
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-[#64748b] leading-tight">
                      {opt.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
