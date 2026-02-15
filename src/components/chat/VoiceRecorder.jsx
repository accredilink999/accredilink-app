import React, { useState, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VoiceRecorder({ onVoiceMessageSend, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const durationIntervalRef = useRef(null);

  const playBeep = (frequency = 880, duration = 0.1) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = frequency;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + duration);
    } catch (error) {
      // Audio not available
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      playBeep(880, 0.1);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      setRecordingDuration(0);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        clearInterval(durationIntervalRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        if (audioBlob.size > 0) {
          setIsSending(true);
          try {
            const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
            const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
            await onVoiceMessageSend({
              content: '🎤 Voice Note',
              attachment_url: file_url,
              attachment_type: 'audio'
            });
          } finally {
            setIsSending(false);
            setRecordingDuration(0);
          }
        }
        audioChunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      playBeep(1100, 0.15);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-500 font-medium animate-pulse">
          {formatDuration(recordingDuration)}
        </span>
        <div className="flex gap-0.5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-red-400 rounded-full animate-pulse"
              style={{ height: `${8 + Math.random() * 12}px`, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={stopRecording}
          className="p-2.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors flex-shrink-0"
        >
          <Square className="w-4 h-4 text-white fill-white" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      disabled={disabled || isSending}
      className="p-2.5 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0"
      title="Hold to record voice note, release to send"
    >
      <Mic className="w-6 h-6 text-[#54656f]" />
    </button>
  );
}
