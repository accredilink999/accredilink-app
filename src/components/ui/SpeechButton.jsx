/**
 * SpeechButton — A mic button that records speech and returns transcribed text.
 *
 * Uses Web Speech API on supported browsers, falls back to audio recording
 * + Groq Whisper transcription for mobile/WebViews.
 *
 * Usage:
 *   <SpeechButton onResult={(text) => setField(text)} />
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff } from 'lucide-react'
import useSpeechToText from '@/hooks/useSpeechToText'

export default function SpeechButton({ onResult, className = '', size = 'icon', lang = 'en-GB' }) {
  const { isListening, toggleListening } = useSpeechToText({
    onResult,
    lang,
  })

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={toggleListening}
      className={`${isListening ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' : 'bg-blue-500 text-white hover:bg-blue-600'} ${className}`}
      title={isListening ? 'Tap to stop recording' : 'Tap to speak'}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </Button>
  )
}
