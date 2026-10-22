/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Sliders, 
  Layers, 
  Palette, 
  Type, 
  Timer, 
  AlignLeft, 
  Globe, 
  Crop,
  RotateCw
} from 'lucide-react';
import { SourceItem } from '../types/studio';

interface SourcePropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: SourceItem | null;
  onSave: (id: string, updates: Partial<SourceItem>) => void;
}

export const SourcePropertiesModal: React.FC<SourcePropertiesModalProps> = ({
  isOpen,
  onClose,
  source,
  onSave
}) => {
  if (!isOpen || !source) return null;

  const [form, setForm] = useState<SourceItem>({ ...source });

  const handleSave = () => {
    onSave(source.id, { ...form });
    onClose();
  };

  const updateConfig = (field: string, val: any) => {
    setForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: val
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#14171d] border border-[#2a303c] rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden select-none">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#181b22] border-b border-[#242932] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Source Properties: <span className="text-blue-400">{source.name}</span>
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#121419] text-xs">
          {/* General Properties */}
          <div className="space-y-3 pb-3 border-b border-[#242932]">
            <div>
              <label className="block text-[#9aa4b6] font-semibold mb-1">Source Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#181c24] border border-[#2c3442] rounded px-3 py-1.5 text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Coordinates & Dimensions */}
            <div className="grid grid-cols-4 gap-2 font-mono">
              <div>
                <label className="block text-[#64748b] text-[10px] mb-0.5">X (POS)</label>
                <input
                  type="number"
                  value={form.x}
                  onChange={(e) => setForm({ ...form, x: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-2 py-1 text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[#64748b] text-[10px] mb-0.5">Y (POS)</label>
                <input
                  type="number"
                  value={form.y}
                  onChange={(e) => setForm({ ...form, y: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-2 py-1 text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[#64748b] text-[10px] mb-0.5">WIDTH</label>
                <input
                  type="number"
                  value={form.width}
                  onChange={(e) => setForm({ ...form, width: Math.max(10, parseInt(e.target.value, 10) || 10) })}
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-2 py-1 text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[#64748b] text-[10px] mb-0.5">HEIGHT</label>
                <input
                  type="number"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: Math.max(10, parseInt(e.target.value, 10) || 10) })}
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-2 py-1 text-white text-center"
                />
              </div>
            </div>

            {/* Opacity & Rotation */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-[#9aa4b6] mb-1">
                  <span>Opacity:</span>
                  <span className="font-mono text-white">{Math.round(form.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={form.opacity}
                  onChange={(e) => setForm({ ...form, opacity: parseFloat(e.target.value) })}
                  className="fader w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#9aa4b6] mb-1">
                  <span>Rotation:</span>
                  <span className="font-mono text-white">{form.rotation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={form.rotation}
                  onChange={(e) => setForm({ ...form, rotation: parseInt(e.target.value, 10) })}
                  className="fader w-full"
                />
              </div>
            </div>
          </div>

          {/* Type-Specific Properties */}
          {form.type === 'lowerthird' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-indigo-400">
                Lower-Third Graphic Settings
              </h4>
              <div>
                <label className="block text-[#9aa4b6] mb-1">Presenter / Speaker Name</label>
                <input
                  type="text"
                  value={form.config.presenterName || ''}
                  onChange={(e) => updateConfig('presenterName', e.target.value)}
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-[#9aa4b6] mb-1">Title / Social Handle</label>
                <input
                  type="text"
                  value={form.config.presenterRole || ''}
                  onChange={(e) => updateConfig('presenterRole', e.target.value)}
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-[#9aa4b6] mb-1">Accent Bar Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.config.accentColor || '#3b82f6'}
                    onChange={(e) => updateConfig('accentColor', e.target.value)}
                    className="w-9 h-8 rounded border border-[#2c3442] bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-white">{form.config.accentColor || '#3b82f6'}</span>
                </div>
              </div>
            </div>
          )}

          {form.type === 'ticker' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-teal-400">
                News Ticker / Crawl Settings
              </h4>
              <div>
                <label className="block text-[#9aa4b6] mb-1">Ticker Message</label>
                <textarea
                  rows={2}
                  value={form.config.tickerText || ''}
                  onChange={(e) => updateConfig('tickerText', e.target.value)}
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-3 py-1.5 text-white resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9aa4b6] mb-1">Scroll Speed (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.config.tickerSpeed || 3}
                    onChange={(e) => updateConfig('tickerSpeed', parseInt(e.target.value, 10) || 3)}
                    className="w-full bg-[#181c24] border border-[#2c3442] rounded px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#9aa4b6] mb-1">Text Color</label>
                  <input
                    type="color"
                    value={form.config.tickerTextColor || '#ffffff'}
                    onChange={(e) => updateConfig('tickerTextColor', e.target.value)}
                    className="w-full h-8 rounded border border-[#2c3442] bg-transparent cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {form.type === 'countdown' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-rose-400">
                Countdown Timer Settings
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9aa4b6] mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={form.config.durationMinutes || 5}
                    onChange={(e) => updateConfig('durationMinutes', parseInt(e.target.value, 10) || 5)}
                    className="w-full bg-[#181c24] border border-[#2c3442] rounded px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#9aa4b6] mb-1">Digits Color</label>
                  <input
                    type="color"
                    value={form.config.textColor || '#60a5fa'}
                    onChange={(e) => updateConfig('textColor', e.target.value)}
                    className="w-full h-8 rounded border border-[#2c3442] bg-transparent cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#9aa4b6] mb-1">Label Above Timer</label>
                <input
                  type="text"
                  value={form.config.countdownLabel || ''}
                  onChange={(e) => updateConfig('countdownLabel', e.target.value)}
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-[#9aa4b6] mb-1">Completion Text</label>
                <input
                  type="text"
                  value={form.config.countdownCompletedText || ''}
                  onChange={(e) => updateConfig('countdownCompletedText', e.target.value)}
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-3 py-1.5 text-white"
                />
              </div>
            </div>
          )}

          {form.type === 'text' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-sky-400">
                Text Overlay Settings
              </h4>
              <div>
                <label className="block text-[#9aa4b6] mb-1">Text String</label>
                <input
                  type="text"
                  value={form.config.text || ''}
                  onChange={(e) => updateConfig('text', e.target.value)}
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-3 py-1.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9aa4b6] mb-1">Font Size (px)</label>
                  <input
                    type="number"
                    min="12"
                    max="140"
                    value={form.config.fontSize || 24}
                    onChange={(e) => updateConfig('fontSize', parseInt(e.target.value, 10) || 24)}
                    className="w-full bg-[#181c24] border border-[#2c3442] rounded px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#9aa4b6] mb-1">Text Color</label>
                  <input
                    type="color"
                    value={form.config.textColor || '#ffffff'}
                    onChange={(e) => updateConfig('textColor', e.target.value)}
                    className="w-full h-8 rounded border border-[#2c3442] bg-transparent cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {form.type === 'color' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-orange-400">
                Color Background Settings
              </h4>
              <div>
                <label className="block text-[#9aa4b6] mb-1">Backdrop Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.config.color || '#1e293b'}
                    onChange={(e) => updateConfig('color', e.target.value)}
                    className="w-12 h-10 rounded border border-[#2c3442] bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-white text-sm">{form.config.color || '#1e293b'}</span>
                </div>
              </div>
            </div>
          )}

          {form.type === 'browser' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-cyan-400">
                Browser Source Overlay
              </h4>
              <div>
                <label className="block text-[#9aa4b6] mb-1">Overlay Web URL</label>
                <input
                  type="text"
                  value={form.config.browserUrl || ''}
                  onChange={(e) => updateConfig('browserUrl', e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[#9aa4b6] mb-1">Widget Title</label>
                <input
                  type="text"
                  value={form.config.browserTitle || ''}
                  onChange={(e) => updateConfig('browserTitle', e.target.value)}
                  className="w-full bg-[#181c24] border border-[#2c3442] rounded px-3 py-1.5 text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#181b22] border-t border-[#242932] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-semibold text-[#9aa4b6] hover:text-white hover:bg-[#222732] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
