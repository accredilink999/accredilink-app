import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from 'lucide-react';

// Simple human body silhouette SVG paths (front and back)
const FRONT_PATH = `
  M 50,8 C 44,8 40,12 40,18 C 40,24 44,28 50,28 C 56,28 60,24 60,18 C 60,12 56,8 50,8 Z
  M 50,28 L 50,30
  M 38,34 C 40,30 44,29 50,29 C 56,29 60,30 62,34
  L 68,34 L 76,42 L 80,56 L 76,58 L 68,46 L 64,46
  L 64,70 L 66,90 L 66,94 L 58,94 L 56,74 L 50,74 L 44,74 L 42,94 L 34,94 L 34,90 L 36,70
  L 36,46 L 32,46 L 24,58 L 20,56 L 24,42 L 32,34 L 38,34 Z
`;

const BACK_PATH = `
  M 50,8 C 44,8 40,12 40,18 C 40,24 44,28 50,28 C 56,28 60,24 60,18 C 60,12 56,8 50,8 Z
  M 50,28 L 50,30
  M 38,34 C 40,30 44,29 50,29 C 56,29 60,30 62,34
  L 68,34 L 76,42 L 80,56 L 76,58 L 68,46 L 64,46
  L 64,70 L 66,90 L 66,94 L 58,94 L 56,74 L 50,74 L 44,74 L 42,94 L 34,94 L 34,90 L 36,70
  L 36,46 L 32,46 L 24,58 L 20,56 L 24,42 L 32,34 L 38,34 Z
  M 50,34 L 50,68
`;

export default function BodyMap({ markers = [], onChange, readOnly = false }) {
  const [activeSide, setActiveSide] = useState('front');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const containerRef = useRef(null);

  const sideMarkers = markers
    .map((m, i) => ({ ...m, _globalIndex: i }))
    .filter(m => m.side === activeSide);

  const selectedMarker = selectedIndex !== null ? markers[selectedIndex] : null;

  const handlePointerDown = useCallback((e) => {
    if (readOnly || !onChange) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Clamp to valid range
    const cx = Math.max(0, Math.min(1, x));
    const cy = Math.max(0, Math.min(1, y));

    const newMarker = { x: cx, y: cy, side: activeSide, note: '' };
    const updated = [...markers, newMarker];
    onChange(updated);
    setSelectedIndex(updated.length - 1);
  }, [readOnly, onChange, markers, activeSide]);

  const handleMarkerClick = useCallback((e, globalIndex) => {
    e.stopPropagation();
    if (readOnly) {
      setSelectedIndex(selectedIndex === globalIndex ? null : globalIndex);
      return;
    }
    setSelectedIndex(selectedIndex === globalIndex ? null : globalIndex);
  }, [readOnly, selectedIndex]);

  const handleDeleteMarker = useCallback(() => {
    if (readOnly || !onChange || selectedIndex === null) return;
    const updated = markers.filter((_, i) => i !== selectedIndex);
    onChange(updated);
    setSelectedIndex(null);
  }, [readOnly, onChange, markers, selectedIndex]);

  const handleNoteChange = useCallback((note) => {
    if (readOnly || !onChange || selectedIndex === null) return;
    const updated = markers.map((m, i) => i === selectedIndex ? { ...m, note } : m);
    onChange(updated);
  }, [readOnly, onChange, markers, selectedIndex]);

  const path = activeSide === 'front' ? FRONT_PATH : BACK_PATH;

  return (
    <div className="space-y-3">
      {/* Tab toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => { setActiveSide('front'); setSelectedIndex(null); }}
          className={activeSide === 'front'
            ? 'bg-teal-600 hover:bg-teal-700 text-white'
            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
        >
          Front
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => { setActiveSide('back'); setSelectedIndex(null); }}
          className={activeSide === 'back'
            ? 'bg-teal-600 hover:bg-teal-700 text-white'
            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
        >
          Back
        </Button>
        <span className="text-xs text-slate-500 self-center ml-2">
          {markers.length} marker{markers.length !== 1 ? 's' : ''} total
          {!readOnly && ' — tap to place'}
        </span>
      </div>

      {/* Body outline + markers */}
      <div
        ref={containerRef}
        className="relative bg-slate-50 border border-slate-200 rounded-lg overflow-hidden select-none"
        style={{ aspectRatio: '1 / 1.8', maxWidth: 280, touchAction: 'none' }}
        onPointerDown={!readOnly ? handlePointerDown : undefined}
      >
        {/* SVG body outline */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ pointerEvents: 'none' }}
        >
          <path
            d={path}
            fill="#f1f5f9"
            stroke="#94a3b8"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>

        {/* Marker overlays */}
        {sideMarkers.map((marker) => (
          <div
            key={marker._globalIndex}
            className={`absolute flex items-center justify-center cursor-pointer transition-transform
              ${selectedIndex === marker._globalIndex ? 'scale-125 z-10' : 'z-0'}`}
            style={{
              left: `${marker.x * 100}%`,
              top: `${marker.y * 100}%`,
              transform: `translate(-50%, -50%) ${selectedIndex === marker._globalIndex ? 'scale(1.25)' : ''}`,
              width: 24,
              height: 24,
            }}
            onPointerDown={(e) => handleMarkerClick(e, marker._globalIndex)}
          >
            <span
              className={`text-lg font-bold leading-none select-none
                ${selectedIndex === marker._globalIndex ? 'text-red-700' : 'text-red-500'}`}
              style={{ textShadow: '0 0 3px white, 0 0 3px white' }}
            >
              X
            </span>
          </div>
        ))}
      </div>

      {/* Selected marker details */}
      {selectedMarker && (
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-xs text-slate-600 font-medium shrink-0">
            Marker {selectedIndex + 1}:
          </span>
          {readOnly ? (
            <span className="text-sm text-slate-800 flex-1">
              {selectedMarker.note || 'No note'}
            </span>
          ) : (
            <>
              <Input
                value={selectedMarker.note || ''}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Add note for this area..."
                className="h-8 text-sm flex-1 border-slate-300"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDeleteMarker}
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Marker notes list (read-only mode) */}
      {readOnly && markers.length > 0 && (
        <div className="space-y-1">
          {markers.map((m, i) => (
            <div
              key={i}
              className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors
                ${selectedIndex === i ? 'bg-red-100 text-red-800' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => { setActiveSide(m.side); setSelectedIndex(i); }}
            >
              <span className="font-medium">{i + 1}.</span>{' '}
              <span className="capitalize">{m.side}</span>
              {m.note && <span> — {m.note}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
