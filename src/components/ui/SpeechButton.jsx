/**
 * SpeechButton — Mic button for speech-to-text.
 *
 * On mobile/Capacitor: User taps → native audio recorder opens → audio transcribed via Whisper.
 * On desktop Chrome: Uses Web Speech API for live transcription.
 */

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { invokeFunction } from '@/api/functions'
import { toast } from 'sonner'

const isCapacitorOrMobile = () =>
  !!window.Capacitor?.isNativePlatform?.() ||
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

function hasSpeechRecognition() {
  if (!!window.Capacitor?.isNativePlatform?.()) return false
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

export default function SpeechButton({ onResult, className = '', size = 'icon', lang = 'en-GB' }) {
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const recognitionRef = useRef(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  // ── Transcribe an audio file via Whisper ──
  const transcribeFile = useCallback(async (file) => {
    if (!file) return
    setIsTranscribing(true)
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const b64 = reader.result?.split(',')[1]
          b64 ? resolve(b64) : reject(new Error('encode failed'))
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })

      toast.info('Transcribing your speech...', { duration: 8000, id: 'stt' })

      const result = await invokeFunction('transcribeAudio', {
        audioBase64: base64,
        mimeType: file.type || 'audio/webm',
      })

      toast.dismiss('stt')

      if (result?.transcript) {
        if (onResultRef.current) onResultRef.current(result.transcript)
        toast.success('Speech added', { duration: 1500 })
      } else {
        toast.error('No speech detected. Please try again.')
      }
    } catch (err) {
      toast.dismiss('stt')
      console.error('[SpeechButton] Transcription error:', err)
      toast.error('Transcription failed: ' + (err.message || 'Unknown error'))
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  // ── Desktop: Web Speech API ──
  const handleDesktopClick = useCallback(() => {
    if (isListening) {
      // Stop
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
        recognitionRef.current = null
      }
      setIsListening(false)
      return
    }

    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SR()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = lang

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript
        if (onResultRef.current) onResultRef.current(transcript)
      }
      recognition.onerror = (event) => {
        console.warn('[SpeechButton] SpeechRecognition error:', event.error)
        setIsListening(false)
        recognitionRef.current = null
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Check permissions.')
        } else if (event.error !== 'no-speech') {
          toast.error('Speech error: ' + event.error)
        }
      }
      recognition.onend = () => {
        setIsListening(false)
        recognitionRef.current = null
      }
      recognition.start()
      recognitionRef.current = recognition
      setIsListening(true)
    } catch (err) {
      console.error('[SpeechButton] SpeechRecognition start error:', err)
      toast.error('Speech recognition unavailable')
    }
  }, [isListening, lang])

  const useMobile = isCapacitorOrMobile() || !hasSpeechRecognition()

  // ── Mobile/Capacitor: native file input for audio capture ──
  if (useMobile) {
    return (
      <label
        className={`inline-flex items-center justify-center rounded-md cursor-pointer
          ${isTranscribing
            ? 'bg-amber-500 text-white pointer-events-none'
            : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'}
          ${size === 'icon' ? 'h-10 w-10' : 'h-10 px-3'}
          ${className}`}
        title={isTranscribing ? 'Transcribing...' : 'Tap to record voice'}
      >
        <input
          type="file"
          accept="audio/*"
          capture="environment"
          className="hidden"
          disabled={isTranscribing}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) transcribeFile(file)
            e.target.value = ''
          }}
        />
        {isTranscribing
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Mic className="w-4 h-4" />
        }
      </label>
    )
  }

  // ── Desktop: speech recognition button ──
  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={handleDesktopClick}
      className={`${isListening ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' : 'bg-blue-500 text-white hover:bg-blue-600'} ${className}`}
      title={isListening ? 'Tap to stop recording' : 'Tap to speak'}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </Button>
  )
}
