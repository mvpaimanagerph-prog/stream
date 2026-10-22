/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Radio, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Download, 
  Upload, 
  ExternalLink, 
  Check, 
  AlertTriangle,
  Server,
  Layers,
  Code2,
  Tv
} from 'lucide-react';
import { StreamConfig } from '../types/studio';

interface StreamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StreamConfig;
  onSaveConfig: (updated: StreamConfig) => void;
  onExportScenes: () => void;
  onImportScenes: () => void;
}

export const StreamSettingsModal: React.FC<StreamSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onExportScenes,
  onImportScenes
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'facebook_guide' | 'meta_api' | 'architecture' | 'backup'>('stream');
  const [form, setForm] = useState<StreamConfig>({ ...config });
  const [showKey, setShowKey] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#14171d] border border-[#2a303c] rounded-xl w-full max-w-4xl h-[640px] flex flex-col shadow-2xl overflow-hidden select-none">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#181b22] border-b border-[#242932] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Broadcast & Stream Configuration</h2>
              <p className="text-[11px] text-[#848ea0]">Configure Facebook Live, RTMPS endpoints, encoders, and resolution</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 bg-[#161a21] border-b border-[#242932] text-xs font-medium gap-2">
          <button
            onClick={() => setActiveTab('stream')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'stream' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-[#9aa4b6] hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Stream Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('facebook_guide')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'facebook_guide' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-[#9aa4b6] hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Facebook Live Producer Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('meta_api')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'meta_api' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-[#9aa4b6] hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Meta Live Video API</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'architecture' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-[#9aa4b6] hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>RTMPS Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'backup' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-[#9aa4b6] hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Scene Backup & Import</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#121419]">
          {activeTab === 'stream' && (
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Destination Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5 uppercase tracking-wide">
                  Stream Destination
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'facebook', label: 'Facebook Live' },
                    { id: 'youtube', label: 'YouTube Live' },
                    { id: 'twitch', label: 'Twitch' },
                    { id: 'custom', label: 'Custom RTMPS' }
                  ].map(dest => (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => {
                        const newDest = dest.id as any;
                        let defaultUrl = form.rtmpUrl;
                        if (newDest === 'facebook') defaultUrl = 'rtmps://live-api-s.facebook.com:443/rtmp/';
                        if (newDest === 'youtube') defaultUrl = 'rtmp://a.rtmp.youtube.com/live2';
                        if (newDest === 'twitch') defaultUrl = 'rtmp://live.twitch.tv/app/';
                        setForm({ ...form, destination: newDest, rtmpUrl: defaultUrl });
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border text-center transition-all ${
                        form.destination === dest.id
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                          : 'bg-[#181b22] border-[#29303d] text-[#9aa4b6] hover:border-[#3d475a]'
                      }`}
                    >
                      {dest.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Server URL */}
              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5 uppercase tracking-wide">
                  Stream Server URL (RTMPS)
                </label>
                <input
                  type="text"
                  value={form.rtmpUrl}
                  onChange={(e) => setForm({ ...form, rtmpUrl: e.target.value })}
                  placeholder="rtmps://live-api-s.facebook.com:443/rtmp/"
                  className="w-full bg-[#181c24] border border-[#2b3341] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-[#64748b] mt-1">
                  Facebook Live uses secure port 443 with TLS encryption (RTMPS).
                </p>
              </div>

              {/* Stream Key with strict secret redaction */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wide flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Stream Key (Sensitive Secret)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showKey ? 'Mask Secret' : 'Show Key'}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={form.streamKey}
                    onChange={(e) => setForm({ ...form, streamKey: e.target.value })}
                    placeholder="FB-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[#181c24] border border-[#2b3341] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500/80 pr-10"
                  />
                </div>

                {/* Secret Redaction Disclaimer */}
                <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Zero-Persistence Security Safeguard:</strong>
                    <span className="text-emerald-300/90 ml-1">
                      Stream keys are never saved to localStorage, IndexedDB, or logs. Your key remains in browser volatile memory solely for this session.
                    </span>
                  </div>
                </div>
              </div>

              {/* Encoders & Bitrate Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                    Output Resolution
                  </label>
                  <select
                    value={form.resolution}
                    onChange={(e) => setForm({ ...form, resolution: e.target.value as any })}
                    className="w-full bg-[#181c24] border border-[#2b3341] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="1080p">1080p (Full HD 1920x1080)</option>
                    <option value="720p">720p (HD 1280x720)</option>
                    <option value="480p">480p (SD 854x480)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                    Video Bitrate (kbps)
                  </label>
                  <select
                    value={form.videoBitrate}
                    onChange={(e) => setForm({ ...form, videoBitrate: parseInt(e.target.value, 10) })}
                    className="w-full bg-[#181c24] border border-[#2b3341] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="2500">2,500 kbps (Standard 720p)</option>
                    <option value="4000">4,000 kbps (High 720p / 60)</option>
                    <option value="4500">4,500 kbps (Recommended 1080p)</option>
                    <option value="6000">6,000 kbps (High-Motion 1080p)</option>
                    <option value="8000">8,000 kbps (Esports Ultra)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                    Framerate (FPS)
                  </label>
                  <select
                    value={form.fps}
                    onChange={(e) => setForm({ ...form, fps: parseInt(e.target.value, 10) as any })}
                    className="w-full bg-[#181c24] border border-[#2b3341] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="30">30 FPS (Standard Facebook)</option>
                    <option value="60">60 FPS (Gaming & Smooth)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'facebook_guide' && (
            <div className="max-w-2xl mx-auto space-y-4 text-xs text-[#cbd5e1]">
              <div className="p-4 bg-[#181c24] border border-[#2b3341] rounded-lg">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-blue-400" />
                  <span>Step-by-Step Facebook Live Producer Workflow</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2.5 text-[#9aa4b6] mt-3">
                  <li>
                    <strong className="text-white">Open Live Producer:</strong> Navigate to{' '}
                    <a 
                      href="https://facebook.com/live/producer" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-blue-400 underline inline-flex items-center gap-1"
                    >
                      facebook.com/live/producer <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    <strong className="text-white">Select Video Source:</strong> Choose{' '}
                    <span className="text-white bg-[#222834] px-1.5 py-0.5 rounded font-mono">Streaming software</span>.
                  </li>
                  <li>
                    <strong className="text-white">Copy Stream Credentials:</strong> Copy the{' '}
                    <span className="text-amber-300">Server URL</span> and{' '}
                    <span className="text-amber-300">Stream Key</span> into LiveStudio PH's Stream Setup tab.
                  </li>
                  <li>
                    <strong className="text-white">Start Sending Stream:</strong> In LiveStudio PH, click{' '}
                    <span className="text-red-400 font-bold">Go Live</span>. LiveStudio PH begins rendering your scenes, camera, and overlays into high-definition video chunks.
                  </li>
                  <li>
                    <strong className="text-white">Review Preview & Broadcast:</strong> Check the video feed in Facebook Live Producer, write your post title, and click Facebook's blue{' '}
                    <span className="text-blue-400 font-bold">"Go live"</span> button!
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-lg text-[11px] text-blue-200">
                <strong className="font-semibold block mb-1">Facebook Live Optimal Video Specs:</strong>
                <ul className="list-disc list-inside space-y-1 text-blue-300">
                  <li>Aspect Ratio: 16:9 widescreen or 9:16 vertical</li>
                  <li>Resolution: 1080p (1920x1080) or 720p (1280x720)</li>
                  <li>Recommended Bitrate: 4,000–6,000 kbps for 1080p</li>
                  <li>Audio Codec: AAC / Opus 128–160 kbps, 44.1 kHz or 48 kHz</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'meta_api' && (
            <div className="max-w-2xl mx-auto space-y-4 text-xs text-[#cbd5e1]">
              <div className="p-4 bg-[#181c24] border border-[#2b3341] rounded-lg">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span>Meta Graph API Live Video Publishing</span>
                </h3>
                <p className="text-[#9aa4b6] mb-3 leading-relaxed">
                  For automated broadcasting or enterprise Page management, broadcast endpoints can be created via Meta's Live Video API:
                </p>

                <div className="bg-[#0f1217] p-3 rounded border border-[#242932] font-mono text-[11px] text-[#38bdf8] overflow-x-auto">
                  POST https://graph.facebook.com/v19.0/{'{page-id}'}/live_videos
                  <br />
                  Authorization: Bearer {'{PAGE_ACCESS_TOKEN}'}
                  <br /><br />
                  Payload: &#123;
                  <br />
                  &nbsp;&nbsp;"title": "Live Broadcast via LiveStudio PH",
                  <br />
                  &nbsp;&nbsp;"description": "Live production powered by LiveStudio PH OBS engine.",
                  <br />
                  &nbsp;&nbsp;"status": "LIVE_NOW",
                  <br />
                  &nbsp;&nbsp;"stream_type": "REGULAR"
                  <br />
                  &#125;
                </div>

                <div className="mt-3 text-[11px] text-[#848ea0] space-y-1">
                  <div><strong>Required Meta Scopes:</strong> <code className="text-emerald-400 font-mono">pages_manage_posts</code>, <code className="text-emerald-400 font-mono">publish_video</code></div>
                  <div><strong>Response:</strong> Returns JSON containing <code className="text-amber-400 font-mono">secure_stream_url</code> and <code className="text-amber-400 font-mono">id</code>.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="max-w-2xl mx-auto space-y-4 text-xs text-[#cbd5e1]">
              <div className="p-4 bg-[#181c24] border border-[#2b3341] rounded-lg">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>Streaming Media Architecture & RTMPS Bridge</span>
                </h3>
                <p className="text-[#9aa4b6] leading-relaxed mb-3">
                  <strong>Technical Architecture Boundary:</strong> Web browsers operate in a security sandbox and natively encode video via <code className="text-white">MediaRecorder</code> and <code className="text-white">WebRTC</code>. Standard RTMPS uses raw TCP sockets on port 443 which browsers cannot directly open without an intermediary bridge.
                </p>

                <div className="p-3 bg-[#10141b] border border-[#242b36] rounded text-[11px] space-y-2 text-[#94a3b8]">
                  <div className="text-white font-semibold">Supported Production Topologies:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span><strong>1. Browser-Direct Live Preview & Record:</strong> Local canvas composition, real webcam/mic mixing, and instant WebM broadcast capture.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span><strong>2. Node / SRS Media Relay:</strong> Browser sends WebRTC/WebSocket stream $\rightarrow$ Server muxes to RTMPS $\rightarrow$ Facebook Live.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span><strong>3. Native Desktop Pipeline (FFmpeg):</strong> Forward the studio stream to Facebook with this one-line command:</span>
                  </div>
                </div>

                <div className="mt-3 bg-[#0a0c10] p-2.5 rounded border border-[#202530] font-mono text-[11px] text-emerald-400 select-all overflow-x-auto">
                  ffmpeg -re -i broadcast.webm -c:v libx264 -preset veryfast -b:v 4500k -c:a aac -b:a 160k -f flv "rtmps://live-api-s.facebook.com:443/rtmp/[YOUR_STREAM_KEY]"
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="max-w-2xl mx-auto space-y-4 text-xs text-[#cbd5e1]">
              <div className="p-4 bg-[#181c24] border border-[#2b3341] rounded-lg">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Scene Collection Import & Export</span>
                </h3>
                <p className="text-[#9aa4b6] mb-4">
                  Export your entire OBS scene hierarchy, overlays, tickers, and audio channels to a validated JSON file to share between devices or keep backups.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onExportScenes}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Scene Package (.json)</span>
                  </button>

                  <button
                    onClick={onImportScenes}
                    className="px-4 py-2.5 rounded-lg bg-[#222834] hover:bg-[#2c3444] text-[#e2e8f0] font-semibold border border-[#343e50] flex items-center gap-2 shadow-md transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import Scene Package</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#181b22] border-t border-[#242932] flex items-center justify-between">
          <span className="text-xs text-[#64748b]">
            Destination: <strong className="text-[#9aa4b6]">{form.destination.toUpperCase()}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#9aa4b6] hover:text-white hover:bg-[#222732] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md transition-all"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : null}
              <span>{savedSuccess ? 'Saved' : 'Save & Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
