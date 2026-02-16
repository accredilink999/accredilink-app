import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export default function VoiceNotePlayer({ url, isOwn }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const cycleSpeed = () => {
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) audioRef.current.playbackRate = newRate;
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // Generate static waveform bars
  const bars = useRef(Array.from({ length: 28 }, () => 4 + Math.random() * 16)).current;

  return (
    <div className="flex items-center gap-2 min-w-[200px] max-w-[280px]">
      <audio ref={audioRef} src={url} />

      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-[#00a884] hover:bg-[#008f72]"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-white fill-current" />
        ) : (
          <Play className="w-4 h-4 text-white fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform */}
        <div
          className="flex items-end gap-[1.5px] h-5 cursor-pointer"
          onClick={(e) => {
            if (audioRef.current && duration) {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = percent * duration;
            }
          }}
        >
          {bars.map((height, i) => {
            const barProgress = (i / bars.length) * 100;
            const isPlayed = barProgress <= progress;
            return (
              <div
                key={i}
                className={`w-[3px] rounded-full transition-colors ${
                  isPlayed
                    ? isOwn ? 'bg-[#00a884]' : 'bg-[#00a884]'
                    : isOwn ? 'bg-[#9e9e9e]' : 'bg-[#c5c5c5]'
                }`}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>

        {/* Time + speed */}
        <div className="flex items-center justify-between">
          <span className={`text-[11px] ${isOwn ? 'text-[#667781]' : 'text-[#667781]'}`}>
            {formatTime(isPlaying ? currentTime : duration)}
          </span>
          <button
            onClick={cycleSpeed}
            className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#e9edef] text-[#54656f] hover:bg-[#dfe5e7]"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
