import React, { useState, useCallback, useRef, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Save, X, Loader2 } from 'lucide-react';

const Excalidraw = React.lazy(() =>
  import('@excalidraw/excalidraw').then(m => ({ default: m.Excalidraw }))
);

export default function MeetingWhiteboard({ meeting, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const excalidrawAPIRef = useRef(null);

  // Auto-save whiteboard data (debounced)
  const handleChange = useCallback((elements, appState) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await base44.entities.Meeting.update(meeting.id, {
          whiteboard_data: {
            elements,
            appState: {
              viewBackgroundColor: appState.viewBackgroundColor,
              gridSize: appState.gridSize,
            },
          },
        });
      } catch (err) {
        console.error('Whiteboard auto-save error:', err);
      }
    }, 5000);
  }, [meeting.id]);

  const handleManualSave = async () => {
    if (!excalidrawAPIRef.current) return;
    setSaving(true);
    try {
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();
      await base44.entities.Meeting.update(meeting.id, {
        whiteboard_data: {
          elements,
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            gridSize: appState.gridSize,
          },
        },
      });
    } catch (err) {
      console.error('Whiteboard save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const initialData = meeting?.whiteboard_data
    ? {
        elements: meeting.whiteboard_data.elements || [],
        appState: meeting.whiteboard_data.appState || {},
      }
    : undefined;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-white flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b">
        <h3 className="font-medium text-slate-900 text-sm">
          Whiteboard — {meeting.title}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span className="ml-1">Save</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-500 hover:text-slate-700"
            onClick={() => {
              handleManualSave();
              onClose?.();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Excalidraw canvas */}
      <div className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          }
        >
          <Excalidraw
            initialData={initialData}
            onChange={handleChange}
            excalidrawAPI={(api) => { excalidrawAPIRef.current = api; }}
            UIOptions={{
              canvasActions: {
                saveAsImage: true,
                loadScene: false,
                export: { saveFileToDisk: true },
              },
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
