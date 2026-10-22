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
  Edit3, 
  Check, 
  X,
  Clapperboard,
  Tv
} from 'lucide-react';
import { Scene } from '../types/studio';

interface ScenesPanelProps {
  scenes: Scene[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  onAddScene: (name: string) => void;
  onRenameScene: (id: string, newName: string) => void;
  onDuplicateScene: (id: string) => void;
  onDeleteScene: (id: string) => void;
  onMoveScene: (id: string, direction: 'up' | 'down') => void;
}

export const ScenesPanel: React.FC<ScenesPanelProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onRenameScene,
  onDuplicateScene,
  onDeleteScene,
  onMoveScene
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartAdd = () => {
    setNewSceneName(`Scene ${scenes.length + 1}`);
    setIsAdding(true);
  };

  const handleConfirmAdd = () => {
    if (newSceneName.trim()) {
      onAddScene(newSceneName.trim());
      setIsAdding(false);
      setNewSceneName('');
    }
  };

  const handleStartRename = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setEditName(scene.name);
  };

  const handleConfirmRename = () => {
    if (editingSceneId && editName.trim()) {
      onRenameScene(editingSceneId, editName.trim());
      setEditingSceneId(null);
    }
  };

  const selectedIndex = scenes.findIndex(s => s.id === activeSceneId);

  return (
    <div className="flex flex-col h-full bg-[#14171d] border-r border-[#282d37] select-none">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#242932] flex items-center justify-between bg-[#181b22]">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#cbd5e1]">Scenes</span>
        </div>
        <span className="text-[11px] font-mono text-[#64748b] bg-[#1f242d] px-1.5 py-0.5 rounded">
          {scenes.length}
        </span>
      </div>

      {/* Scene List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {scenes.map((scene) => {
          const isActive = scene.id === activeSceneId;
          const isEditing = scene.id === editingSceneId;

          if (isEditing) {
            return (
              <div key={scene.id} className="p-1.5 bg-[#1e232c] border border-blue-500 rounded flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmRename();
                    if (e.key === 'Escape') setEditingSceneId(null);
                  }}
                  className="flex-1 bg-[#12151b] border border-[#313947] text-xs text-white rounded px-2 py-1 outline-none"
                />
                <button 
                  onClick={handleConfirmRename}
                  className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded"
                  title="Save name"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setEditingSceneId(null)}
                  className="p-1 text-[#94a3b8] hover:bg-red-950/40 rounded"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`group px-3 py-2 rounded text-xs flex items-center justify-between cursor-pointer transition-all border ${
                isActive
                  ? 'bg-blue-600/20 text-white border-blue-500/50 shadow-sm font-semibold'
                  : 'text-[#9aa4b6] border-transparent hover:bg-[#1a1e27] hover:text-[#e2e8f0]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Tv className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-[#64748b]'}`} />
                <span className="truncate">{scene.name}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-mono px-1 rounded ${isActive ? 'bg-blue-500/20 text-blue-300' : 'text-[#64748b]'}`}>
                  {scene.sources.filter(s => s.visible).length}/{scene.sources.length}
                </span>
              </div>
            </div>
          );
        })}

        {isAdding && (
          <div className="p-1.5 bg-[#1e232c] border border-blue-500 rounded flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              placeholder="Scene Name"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmAdd();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              className="flex-1 bg-[#12151b] border border-[#313947] text-xs text-white rounded px-2 py-1 outline-none"
            />
            <button 
              onClick={handleConfirmAdd}
              className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded"
              title="Add Scene"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setIsAdding(false)}
              className="p-1 text-[#94a3b8] hover:bg-red-950/40 rounded"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* OBS-style bottom toolbar */}
      <div className="p-1.5 bg-[#181b22] border-t border-[#242932] flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <button
            onClick={handleStartAdd}
            title="Add Scene"
            className="p-1.5 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={scenes.length <= 1}
            onClick={() => onDeleteScene(activeSceneId)}
            title={scenes.length <= 1 ? 'Cannot delete only scene' : 'Delete Scene'}
            className="p-1.5 rounded text-[#9aa4b6] hover:text-red-400 hover:bg-red-950/30 disabled:opacity-30 disabled:hover:text-[#9aa4b6] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDuplicateScene(activeSceneId)}
            title="Duplicate Scene"
            className="p-1.5 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const current = scenes.find(s => s.id === activeSceneId);
              if (current) handleStartRename(current);
            }}
            title="Rename Scene"
            className="p-1.5 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled={selectedIndex <= 0}
            onClick={() => onMoveScene(activeSceneId, 'up')}
            title="Move Scene Up"
            className="p-1.5 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36] disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={selectedIndex >= scenes.length - 1}
            onClick={() => onMoveScene(activeSceneId, 'down')}
            title="Move Scene Down"
            className="p-1.5 rounded text-[#9aa4b6] hover:text-white hover:bg-[#252b36] disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
