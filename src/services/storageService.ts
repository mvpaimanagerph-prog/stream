/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scene, AudioChannel, StreamConfig, MediaItem } from '../types/studio';
import { DEFAULT_SCENES, DEFAULT_AUDIO_CHANNELS, DEFAULT_STREAM_CONFIG, BUILTIN_MEDIA } from '../utils/defaults';

const STORAGE_KEYS = {
  SCENES: 'livestudio_ph_scenes_v1',
  ACTIVE_SCENE_ID: 'livestudio_ph_active_scene_v1',
  AUDIO: 'livestudio_ph_audio_v1',
  STREAM_CONFIG: 'livestudio_ph_stream_settings_v1', // Stores non-secret settings only
  MEDIA: 'livestudio_ph_media_v1',
  STUDIO_PREFS: 'livestudio_ph_prefs_v1'
};

export interface ExportPackage {
  version: string;
  appName: string;
  timestamp: string;
  scenes: Scene[];
  mediaMetadata: { id: string; name: string; type: string }[];
  audioSettings: { id: string; name: string; volume: number; muted: boolean }[];
  streamProfile: Omit<StreamConfig, 'streamKey'>;
}

export class StorageService {
  /**
   * Load scenes with fallback to default scenes
   */
  static loadScenes(): Scene[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SCENES);
      if (!raw) return DEFAULT_SCENES;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].sources) {
        return parsed;
      }
      return DEFAULT_SCENES;
    } catch (err) {
      console.warn('Failed to parse scenes from localStorage, using defaults:', err);
      return DEFAULT_SCENES;
    }
  }

  /**
   * Persist scenes to localStorage
   */
  static saveScenes(scenes: Scene[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(scenes));
    } catch (err) {
      console.error('Failed to save scenes to localStorage:', err);
    }
  }

  /**
   * Load active scene ID
   */
  static loadActiveSceneId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SCENE_ID) || 'scene_starting_soon';
  }

  /**
   * Save active scene ID
   */
  static saveActiveSceneId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SCENE_ID, id);
    } catch (err) {
      console.error('Failed to save active scene ID:', err);
    }
  }

  /**
   * Load audio channels (volume and mute status)
   */
  static loadAudioChannels(): AudioChannel[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUDIO);
      if (!raw) return DEFAULT_AUDIO_CHANNELS;
      const saved = JSON.parse(raw) as Partial<AudioChannel>[];
      return DEFAULT_AUDIO_CHANNELS.map(def => {
        const match = saved.find(s => s.id === def.id);
        if (match) {
          return {
            ...def,
            volume: typeof match.volume === 'number' ? match.volume : def.volume,
            muted: typeof match.muted === 'boolean' ? match.muted : def.muted
          };
        }
        return def;
      });
    } catch {
      return DEFAULT_AUDIO_CHANNELS;
    }
  }

  /**
   * Persist audio channel levels/mute
   */
  static saveAudioChannels(channels: AudioChannel[]): void {
    try {
      const safeData = channels.map(c => ({
        id: c.id,
        name: c.name,
        volume: c.volume,
        muted: c.muted
      }));
      localStorage.setItem(STORAGE_KEYS.AUDIO, JSON.stringify(safeData));
    } catch (err) {
      console.error('Failed to save audio settings:', err);
    }
  }

  /**
   * Load stream config (NEVER loads a streamKey from storage!)
   */
  static loadStreamConfig(): StreamConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STREAM_CONFIG);
      if (!raw) return { ...DEFAULT_STREAM_CONFIG, streamKey: '' };
      const parsed = JSON.parse(raw);
      // Guarantee streamKey is empty on load to prevent leak
      return {
        ...DEFAULT_STREAM_CONFIG,
        ...parsed,
        streamKey: ''
      };
    } catch {
      return { ...DEFAULT_STREAM_CONFIG, streamKey: '' };
    }
  }

  /**
   * Save stream profile without secret streamKey
   */
  static saveStreamConfig(config: StreamConfig): void {
    try {
      // Explicitly omit streamKey from persistent storage
      const { streamKey: _omittedKey, ...safeProfile } = config;
      localStorage.setItem(STORAGE_KEYS.STREAM_CONFIG, JSON.stringify(safeProfile));
    } catch (err) {
      console.error('Failed to save stream profile:', err);
    }
  }

  /**
   * Load media items
   */
  static loadMedia(): MediaItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MEDIA);
      if (!raw) return BUILTIN_MEDIA;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return BUILTIN_MEDIA;
    } catch {
      return BUILTIN_MEDIA;
    }
  }

  /**
   * Save media items
   */
  static saveMedia(media: MediaItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(media));
    } catch (err) {
      console.error('Failed to save media library:', err);
    }
  }

  /**
   * Export scene collection and settings to downloadable JSON
   */
  static exportPackage(
    scenes: Scene[],
    media: MediaItem[],
    audio: AudioChannel[],
    streamConfig: StreamConfig
  ): string {
    const { streamKey: _omitted, ...safeStreamProfile } = streamConfig;
    const pkg: ExportPackage = {
      version: '1.0.0',
      appName: 'LiveStudio PH',
      timestamp: new Date().toISOString(),
      scenes,
      mediaMetadata: media.map(m => ({ id: m.id, name: m.name, type: m.type })),
      audioSettings: audio.map(a => ({ id: a.id, name: a.name, volume: a.volume, muted: a.muted })),
      streamProfile: safeStreamProfile
    };
    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Validate and import scenes package from JSON
   */
  static validateAndImport(jsonString: string): { success: boolean; scenes?: Scene[]; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'File is not a valid JSON object.' };
      }

      let scenesCandidate: any = null;
      if (Array.isArray(parsed)) {
        scenesCandidate = parsed;
      } else if (Array.isArray(parsed.scenes)) {
        scenesCandidate = parsed.scenes;
      }

      if (!scenesCandidate || scenesCandidate.length === 0) {
        return { success: false, error: 'No scene configuration found in the file.' };
      }

      // Validate scene integrity
      for (let i = 0; i < scenesCandidate.length; i++) {
        const s = scenesCandidate[i];
        if (!s.id || typeof s.name !== 'string' || !Array.isArray(s.sources)) {
          return { success: false, error: `Invalid scene structure at index ${i}. Missing id, name, or sources array.` };
        }
      }

      return { success: true, scenes: scenesCandidate as Scene[] };
    } catch (e: any) {
      return { success: false, error: `JSON Parse error: ${e?.message || 'Invalid format'}` };
    }
  }
}
