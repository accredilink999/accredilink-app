import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const playNotificationSound = (priority = 'normal') => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const frequencies = {
      critical: 800,
      high: 600,
      normal: 500,
      low: 400
    };
    
    const durations = {
      critical: 0.5,
      high: 0.3,
      normal: 0.2,
      low: 0.15
    };
    
    oscillator.frequency.value = frequencies[priority] || 500;
    oscillator.type = priority === 'critical' ? 'square' : 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + durations[priority]);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + durations[priority]);
  } catch (error) {
    console.error('Audio notification failed:', error);
  }
};

export default function NotificationBanner({ notification, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);
  const [expandedOpen, setExpandedOpen] = useState(false);

  useEffect(() => {
    playNotificationSound(notification.priority);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 6000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!isVisible) return null;

  const priorityStyles = {
    low: 'bg-blue-50 border-blue-200 text-blue-900',
    normal: 'bg-slate-50 border-slate-200 text-slate-900',
    high: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    critical: 'bg-red-50 border-red-200 text-red-900',
  };

  const iconMap = {
    low: <Info className="w-5 h-5 text-blue-600" />,
    normal: <Info className="w-5 h-5 text-slate-600" />,
    high: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    critical: <AlertTriangle className="w-5 h-5 text-red-600" />,
  };

  return (
    <>
      <div
        onClick={() => setExpandedOpen(true)}
        className={`border rounded-lg p-4 flex items-start gap-3 cursor-pointer hover:shadow-lg transition-shadow ${priorityStyles[notification.priority]}`}
      >
        {iconMap[notification.priority]}
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{notification.title}</h3>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            onDismiss?.();
          }}
          className="text-gray-500 hover:text-gray-700 flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <Dialog open={expandedOpen} onOpenChange={setExpandedOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {iconMap[notification.priority]}
              {notification.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <DialogDescription>{notification.message}</DialogDescription>
            {notification.description && (
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {notification.description}
              </div>
            )}
            {notification.details && (
              <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-2">
                {typeof notification.details === 'string' ? (
                  <p className="whitespace-pre-wrap">{notification.details}</p>
                ) : (
                  Object.entries(notification.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium text-slate-600">{key}:</span>
                      <span className="text-slate-900">{String(value)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}