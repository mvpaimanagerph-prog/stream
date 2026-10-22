/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ScenesPanel } from './components/ScenesPanel';
import { SourcesPanel } from './components/SourcesPanel';
import { PreviewCanvas } from './components/PreviewCanvas';
import { AudioMixer } from './components/AudioMixer';
import { MediaPlaylistModal } from './components/MediaPlaylistModal';
import { StreamSettingsModal } from './components/StreamSettingsModal';
import { SourcePropertiesModal } from './components/SourcePropertiesModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';

import { Scene, SourceItem, SourceType, AudioChannel, StreamConfig, MediaItem, StreamStatus, StreamTelemetry } from './types/studio';
import { StorageService } from './services/storageService';
import { MediaService, DeviceInfo } from './services/mediaService';
import { BroadcastService } from './services/broadcastService';
import { DEFAULT_SCENES, DEFAULT_STREAM_CONFIG, DEFAULT_AUDIO_CHANNELS, BUILTIN_MEDIA } from './utils/defaults';

export default function App() {
  // Primary Studio State
  const [scenes, setScenes] = useState<Scene[]>(() => StorageService.loadScenes());
  const [activeSceneId, setActiveSceneId] = useState<string>(() => StorageService.loadActiveSceneId());
  const [programSceneId, setProgramSceneId] = useState<string>(() => StorageService.loadActiveSceneId());
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [audioChannels, setAudioChannels] = useState<AudioChannel[]>(() => StorageService.loadAudioChannels());
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => StorageService.loadMedia());
  const [streamConfig, setStreamConfig] = useState<StreamConfig>(() => StorageService.loadStreamConfig());
  const [activeProfile, setActiveProfile] = useState<string>('Main Facebook Live');
  const [isStudioMode, setIsStudioMode] = useState<boolean>(false);

  // Broadcast & Recording State
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('offline');
  const [telemetry, setTelemetry] = useState<StreamTelemetry>(BroadcastService.getTelemetry());
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const canvasStreamRef = useRef<MediaStream | null>(null);

  // Hardware Media States
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([]);
  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [selectedCamId, setSelectedCamId] = useState<string>('');
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [micPermissionError, setMicPermissionError] = useState<string | undefined>();

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [editingSource, setEditingSource] = useState<SourceItem | null>(null);

  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Scene & Program Scene resolution
  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0] || DEFAULT_SCENES[0];
  const programScene = scenes.find(s => s.id === programSceneId) || activeScene;

  // Persistence triggers
  useEffect(() => {
    StorageService.saveScenes(scenes);
  }, [scenes]);

  useEffect(() => {
    StorageService.saveActiveSceneId(activeSceneId);
  }, [activeSceneId]);

  useEffect(() => {
    StorageService.saveAudioChannels(audioChannels);
  }, [audioChannels]);

  useEffect(() => {
    StorageService.saveMedia(mediaItems);
  }, [mediaItems]);

  // Broadcast Service Listeners
  useEffect(() => {
    const unsubStatus = BroadcastService.onStatusChange((status, tele) => {
      setStreamStatus(status);
      setTelemetry(tele);
    });
    const unsubRec = BroadcastService.onRecordingChange((recording) => {
      setIsRecording(recording);
    });
    return () => {
      unsubStatus();
      unsubRec();
    };
  }, []);

  // Hardware device enumeration
  const refreshDevices = useCallback(async () => {
    const devs = await MediaService.enumerateDevices();
    setMicrophones(devs.microphones);
    setCameras(devs.cameras);
    if (devs.microphones.length > 0 && !selectedMicId) {
      setSelectedMicId(devs.microphones[0].deviceId);
    }
    if (devs.cameras.length > 0 && !selectedCamId) {
      setSelectedCamId(devs.cameras[0].deviceId);
    }
  }, [selectedMicId, selectedCamId]);

  useEffect(() => {
    refreshDevices();
    const unsubDeviceChange = MediaService.onDeviceChange(() => {
      refreshDevices();
    });
    return () => unsubDeviceChange();
  }, [refreshDevices]);

  // Hardware Controls
  const handleEnableCamera = async () => {
    if (cameraStream) {
      MediaService.stopCamera();
      setCameraStream(null);
    } else {
      const res = await MediaService.getCameraStream(selectedCamId);
      if (res.stream) {
        setCameraStream(res.stream);
        refreshDevices();
      } else if (res.error) {
        alert(res.error);
      }
    }
  };

  const handleEnableMic = async () => {
    setMicPermissionError(undefined);
    const res = await MediaService.getMicStream(selectedMicId);
    if (res.stream) {
      setIsMicActive(true);
      refreshDevices();
    } else {
      setIsMicActive(false);
      setMicPermissionError(res.error || 'Microphone unavailable');
    }
  };

  const handleShareScreen = async () => {
    if (screenStream) {
      MediaService.stopScreen();
      setScreenStream(null);
    } else {
      const res = await MediaService.getScreenStream();
      if (res.stream) {
        setScreenStream(res.stream);
      } else if (res.error) {
        alert(res.error);
      }
    }
  };

  // Canvas Stream ready callback
  const handleCanvasStreamReady = useCallback((stream: MediaStream) => {
    canvasStreamRef.current = stream;
  }, []);

  // Scenes Management
  const handleSelectScene = (id: string) => {
    setActiveSceneId(id);
    setSelectedSourceId(null);
    if (!isStudioMode) {
      setProgramSceneId(id);
    }
  };

  const handleAddScene = (name: string) => {
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      name,
      sources: []
    };
    setScenes(prev => [...prev, newScene]);
    setActiveSceneId(newScene.id);
  };

  const handleRenameScene = (id: string, newName: string) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const handleDuplicateScene = (id: string) => {
    const target = scenes.find(s => s.id === id);
    if (!target) return;
    const duplicated: Scene = {
      id: `scene_${Date.now()}`,
      name: `${target.name} (Copy)`,
      sources: target.sources.map(src => ({
        ...src,
        id: `src_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      }))
    };
    setScenes(prev => [...prev, duplicated]);
    setActiveSceneId(duplicated.id);
  };

  const handleDeleteScene = (id: string) => {
    if (scenes.length <= 1) return;
    const remaining = scenes.filter(s => s.id !== id);
    setScenes(remaining);
    if (activeSceneId === id) {
      setActiveSceneId(remaining[0].id);
    }
  };

  const handleMoveScene = (id: string, direction: 'up' | 'down') => {
    const idx = scenes.findIndex(s => s.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;

    const newScenes = [...scenes];
    const [moved] = newScenes.splice(idx, 1);
    newScenes.splice(targetIdx, 0, moved);
    setScenes(newScenes);
  };

  // Sources Management
  const handleAddSource = (type: SourceType) => {
    const count = activeScene.sources.length + 1;
    const maxZ = activeScene.sources.reduce((max, s) => Math.max(max, s.zIndex), 0);

    let defaultProps: Partial<SourceItem> = {
      name: `${type.toUpperCase()} ${count}`,
      x: 100,
      y: 100,
      width: 600,
      height: 400,
      config: {}
    };

    switch (type) {
      case 'webcam':
        defaultProps = {
          name: 'Webcam Feed',
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          config: { deviceLabel: 'Primary Camera' }
        };
        // Auto-request camera if not yet granted
        if (!cameraStream) handleEnableCamera();
        break;

      case 'screen':
        defaultProps = {
          name: 'Screen Share',
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          config: { deviceLabel: 'Display / Window' }
        };
        if (!screenStream) handleShareScreen();
        break;

      case 'lowerthird':
        defaultProps = {
          name: 'Presenter Lower Third',
          x: 80,
          y: 860,
          width: 640,
          height: 130,
          config: {
            presenterName: 'LiveStudio Host',
            presenterRole: 'Broadcast Moderator · Manila',
            accentColor: '#3b82f6',
            lowerThirdStyle: 'modern'
          }
        };
        break;

      case 'ticker':
        defaultProps = {
          name: 'News Ticker Crawl',
          x: 0,
          y: 1010,
          width: 1920,
          height: 70,
          config: {
            tickerText: '🔴 Live Broadcast with LiveStudio PH · Follow our Facebook page for updates!',
            tickerSpeed: 3,
            tickerBgColor: '#0f172a',
            tickerTextColor: '#ffffff'
          }
        };
        break;

      case 'countdown':
        defaultProps = {
          name: 'Stream Countdown',
          x: 660,
          y: 470,
          width: 600,
          height: 140,
          config: {
            durationMinutes: 5,
            countdownLabel: 'BROADCAST STARTS IN',
            countdownCompletedText: 'STREAM IS LIVE NOW!',
            textColor: '#60a5fa'
          }
        };
        break;

      case 'text':
        defaultProps = {
          name: 'Text Overlay',
          x: 100,
          y: 100,
          width: 500,
          height: 80,
          config: {
            text: 'LiveStudio PH Broadcast',
            fontSize: 28,
            fontWeight: 'bold',
            textColor: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: 12
          }
        };
        break;

      case 'color':
        defaultProps = {
          name: 'Color Backdrop',
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          config: { color: '#0f172a' }
        };
        break;

      case 'browser':
        defaultProps = {
          name: 'Browser Source',
          x: 120,
          y: 120,
          width: 800,
          height: 500,
          config: {
            browserUrl: 'https://facebook.com/LiveStudioPH',
            browserTitle: 'Facebook Live Chat & Alerts'
          }
        };
        break;

      case 'image':
        defaultProps = {
          name: 'Image Overlay',
          x: 200,
          y: 150,
          width: 600,
          height: 400,
          config: { imageUrl: BUILTIN_MEDIA[0].url }
        };
        break;

      case 'video':
        defaultProps = {
          name: 'Video Media Player',
          x: 160,
          y: 90,
          width: 1600,
          height: 900,
          config: {
            mediaName: 'Intermission Loop',
            mediaUrl: '',
            loop: true,
            volume: 0.8
          }
        };
        break;
    }

    const newSource: SourceItem = {
      id: `src_${Date.now()}`,
      name: defaultProps.name || `${type} Source`,
      type,
      x: defaultProps.x ?? 100,
      y: defaultProps.y ?? 100,
      width: defaultProps.width ?? 400,
      height: defaultProps.height ?? 300,
      zIndex: maxZ + 1,
      visible: true,
      locked: false,
      opacity: 1,
      rotation: 0,
      crop: { top: 0, right: 0, bottom: 0, left: 0 },
      config: defaultProps.config || {}
    };

    setScenes(prev => prev.map(s => {
      if (s.id === activeScene.id) {
        return { ...s, sources: [...s.sources, newSource] };
      }
      return s;
    }));
    setSelectedSourceId(newSource.id);
  };

  const handleUpdateSource = (id: string, updates: Partial<SourceItem>) => {
    setScenes(prev => prev.map(s => {
      if (s.id === activeScene.id) {
        return {
          ...s,
          sources: s.sources.map(src => src.id === id ? { ...src, ...updates } : src)
        };
      }
      return s;
    }));
  };

  const handleToggleVisibility = (id: string) => {
    const target = activeScene.sources.find(s => s.id === id);
    if (target) {
      handleUpdateSource(id, { visible: !target.visible });
    }
  };

  const handleToggleLock = (id: string) => {
    const target = activeScene.sources.find(s => s.id === id);
    if (target) {
      handleUpdateSource(id, { locked: !target.locked });
    }
  };

  const handleDuplicateSource = (id: string) => {
    const target = activeScene.sources.find(s => s.id === id);
    if (!target) return;
    const duplicated: SourceItem = {
      ...target,
      id: `src_${Date.now()}`,
      name: `${target.name} (Copy)`,
      x: target.x + 40,
      y: target.y + 40,
      zIndex: target.zIndex + 1
    };
    setScenes(prev => prev.map(s => {
      if (s.id === activeScene.id) {
        return { ...s, sources: [...s.sources, duplicated] };
      }
      return s;
    }));
    setSelectedSourceId(duplicated.id);
  };

  const handleDeleteSource = (id: string) => {
    setScenes(prev => prev.map(s => {
      if (s.id === activeScene.id) {
        return { ...s, sources: s.sources.filter(src => src.id !== id) };
      }
      return s;
    }));
    if (selectedSourceId === id) setSelectedSourceId(null);
  };

  const handleMoveSourceOrder = (id: string, direction: 'up' | 'down') => {
    const sorted = [...activeScene.sources].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex(s => s.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    // Swap z-indices
    const tempZ = sorted[idx].zIndex;
    sorted[idx].zIndex = sorted[targetIdx].zIndex;
    sorted[targetIdx].zIndex = tempZ;

    setScenes(prev => prev.map(s => {
      if (s.id === activeScene.id) {
        return { ...s, sources: [...sorted] };
      }
      return s;
    }));
  };

  // Studio Mode Transition
  const handleTransition = () => {
    setProgramSceneId(activeSceneId);
  };

  // Audio Mixer Handlers
  const handleUpdateVolume = (id: string, volume: number) => {
    setAudioChannels(prev => prev.map(c => c.id === id ? { ...c, volume } : c));
  };

  const handleToggleMute = (id: string) => {
    setAudioChannels(prev => prev.map(c => c.id === id ? { ...c, muted: !c.muted } : c));
  };

  // Start / Stop Streaming
  const handleStartStreaming = async () => {
    if (!canvasStreamRef.current) {
      alert('Video canvas is initializing. Please try again in a moment.');
      return;
    }

    // Check if streamKey is present
    if (!streamConfig.streamKey) {
      setIsSettingsOpen(true);
      return;
    }

    const micTrack = MediaService.getActiveMic()?.getAudioTracks()[0] || null;
    const res = await BroadcastService.startStreaming(canvasStreamRef.current, micTrack, streamConfig);
    if (!res.success) {
      alert(`Streaming Error: ${res.error}`);
    }
  };

  const handleStopStreaming = () => {
    BroadcastService.stopStreaming();
  };

  // Recording
  const handleToggleRecording = () => {
    if (isRecording) {
      BroadcastService.stopRecordingAndDownload();
    } else {
      if (!canvasStreamRef.current) return;
      const micTrack = MediaService.getActiveMic()?.getAudioTracks()[0] || null;
      BroadcastService.startRecording(canvasStreamRef.current, micTrack);
    }
  };

  // Export / Import Scene Package
  const handleExportScenes = () => {
    const pkg = StorageService.exportPackage(scenes, mediaItems, audioChannels, streamConfig);
    const blob = new Blob([pkg], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LiveStudio_PH_Scenes_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImportScenes = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = StorageService.validateAndImport(text);
      if (res.success && res.scenes) {
        setScenes(res.scenes);
        setActiveSceneId(res.scenes[0].id);
        alert(`Successfully imported ${res.scenes.length} scenes.`);
      } else {
        alert(`Import Failed: ${res.error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Insert media item from library into active scene
  const handleApplyMediaToScene = (item: MediaItem) => {
    if (item.type === 'video') {
      handleAddSource('video');
      // Update with exact video url
      const targetSrc = activeScene.sources.find(s => s.type === 'video');
      if (targetSrc) {
        handleUpdateSource(targetSrc.id, {
          config: {
            ...targetSrc.config,
            mediaName: item.name,
            mediaUrl: item.url
          }
        });
      }
    } else if (item.type === 'image') {
      handleAddSource('image');
      const targetSrc = activeScene.sources.find(s => s.type === 'image');
      if (targetSrc) {
        handleUpdateSource(targetSrc.id, {
          config: {
            ...targetSrc.config,
            imageUrl: item.url
          }
        });
      }
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0f1115] text-[#e1e4ea] font-sans overflow-hidden select-none">
      {/* Top Bar */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPlaylist={() => setIsPlaylistOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onExportConfig={handleExportScenes}
        onImportConfig={handleImportScenes}
        isStudioMode={isStudioMode}
        onToggleStudioMode={() => setIsStudioMode(!isStudioMode)}
        onStartStreaming={handleStartStreaming}
        onStopStreaming={handleStopStreaming}
        onToggleRecording={handleToggleRecording}
        isRecording={isRecording}
        streamStatus={streamStatus}
        telemetry={telemetry}
        activeProfile={activeProfile}
        onSelectProfile={setActiveProfile}
      />

      {/* Main Workspace: 3-column Layout (Left: Scenes 220px, Center: Preview, Right: Sources 280px) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Scenes Panel */}
        <div className="w-56 shrink-0 h-full">
          <ScenesPanel
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSelectScene={handleSelectScene}
            onAddScene={handleAddScene}
            onRenameScene={handleRenameScene}
            onDuplicateScene={handleDuplicateScene}
            onDeleteScene={handleDeleteScene}
            onMoveScene={handleMoveScene}
          />
        </div>

        {/* Center: Canvas Preview Workspace */}
        <div className="flex-1 h-full flex flex-col overflow-hidden">
          <PreviewCanvas
            sources={activeScene.sources}
            programSources={programScene.sources}
            selectedSourceId={selectedSourceId}
            onSelectSource={setSelectedSourceId}
            onUpdateSource={handleUpdateSource}
            isStudioMode={isStudioMode}
            onTransition={handleTransition}
            cameraStream={cameraStream}
            screenStream={screenStream}
            onCanvasStreamReady={handleCanvasStreamReady}
          />
        </div>

        {/* Right: Sources Layer Panel */}
        <div className="w-72 shrink-0 h-full">
          <SourcesPanel
            sources={activeScene.sources}
            selectedSourceId={selectedSourceId}
            onSelectSource={setSelectedSourceId}
            onAddSource={handleAddSource}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onDuplicateSource={handleDuplicateSource}
            onDeleteSource={handleDeleteSource}
            onMoveSourceOrder={handleMoveSourceOrder}
            onConfigureSource={setEditingSource}
            onEnableCamera={handleEnableCamera}
            onShareScreen={handleShareScreen}
            isCameraActive={Boolean(cameraStream && cameraStream.active)}
            isScreenActive={Boolean(screenStream && screenStream.active)}
          />
        </div>
      </div>

      {/* Bottom Audio Mixer */}
      <AudioMixer
        channels={audioChannels}
        onUpdateVolume={handleUpdateVolume}
        onToggleMute={handleToggleMute}
        microphones={microphones}
        selectedMicId={selectedMicId}
        onSelectMic={(id) => {
          setSelectedMicId(id);
          if (isMicActive) MediaService.getMicStream(id);
        }}
        isMicActive={isMicActive}
        onRequestMicPermission={handleEnableMic}
        micPermissionError={micPermissionError}
      />

      {/* Hidden File Input for Importing Scene Packages */}
      <input
        ref={importFileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFileChange}
        className="hidden"
      />

      {/* Modals */}
      <MediaPlaylistModal
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        mediaItems={mediaItems}
        onAddMedia={(item) => setMediaItems(prev => [item, ...prev])}
        onDeleteMedia={(id) => setMediaItems(prev => prev.filter(m => m.id !== id))}
        onReorderMedia={(id, dir) => {
          const idx = mediaItems.findIndex(m => m.id === id);
          if (idx < 0) return;
          const target = dir === 'up' ? idx - 1 : idx + 1;
          if (target < 0 || target >= mediaItems.length) return;
          const copy = [...mediaItems];
          const [moved] = copy.splice(idx, 1);
          copy.splice(target, 0, moved);
          setMediaItems(copy);
        }}
        onApplyToCurrentScene={handleApplyMediaToScene}
      />

      <StreamSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={streamConfig}
        onSaveConfig={(cfg) => setStreamConfig(cfg)}
        onExportScenes={handleExportScenes}
        onImportScenes={handleImportScenes}
      />

      <SourcePropertiesModal
        isOpen={Boolean(editingSource)}
        onClose={() => setEditingSource(null)}
        source={editingSource}
        onSave={handleUpdateSource}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </div>
  );
}
