/**
 * SpeechButton — A mic button that records speech and returns transcribed text.
 *
 * On desktop: Uses Web Speech API (live transcription).
 * On mobile/Capacitor: Opens native audio recorder, then transcribes via Whisper.
 *
 * Usage:
 *   <SpeechButton onResult={(text) => setField(text)} />
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import useSpeechToText from '@/hooks/useSpeechToText'

export default function SpeechButton({ onResult, className = '', size = 'icon', lang = 'en-GB' }) {
  const { isListening, isTranscribing, toggleListening } = useSpeechToText({
    onResult,
    lang,
  })

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={toggleListening}
      disabled={isTranscribing}
      className={`${isTranscribing ? 'bg-amber-500 text-white hover:bg-amber-600' : isListening ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' : 'bg-blue-500 text-white hover:bg-blue-600'} ${className}`}
      title={isTranscribing ? 'Transcribing...' : isListening ? 'Tap to stop recording' : 'Tap to speak'}
    >
      {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </Button>
  )
}
