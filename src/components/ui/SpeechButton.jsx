/**
 * SpeechButton — Mic button for speech-to-text.
 *
 * On desktop Chrome: Uses Web Speech API for live transcription.
 * On mobile/Capacitor: Records audio via MediaRecorder, transcribes via Whisper.
 * Last resort: Native file input for audio capture.
 */

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { invokeFunction } from '@/api/functions'
import { toast } from 'sonner'

const isCapacitor = () => !!window.Capacitor?.isNativePlatform?.()

function hasSpeechRecognition() {
  if (isCapacitor()) return false
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

export default function SpeechButton({ onResult, className = '', size = 'icon', lang = 'en-GB' }) {
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  // ── Transcribe audio blob via Whisper ──
  const transcribeBlob = useCallback(async (blob) => {
    setIsTranscribing(true)
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const b64 = reader.result?.split(',')[1]
          b64 ? resolve(b64) : reject(new Error('encode failed'))
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      })

      toast.info('Transcribing...', { duration: 8000, id: 'stt' })

      const result = await invokeFunction('transcribeAudio', {
        audioBase64: base64,
        mimeType: blob.type || 'audio/webm',
      })

      toast.dismiss('stt')

      if (result?.transcript) {
        if (onResultRef.current) onResultRef.current(result.transcript)
        toast.success('Speech added', { duration: 1500 })
      } else {
        toast.error('No speech detected. Try again.')
      }
    } catch (err) {
      toast.dismiss('stt')
      console.error('[SpeechButton] Transcription error:', err)
      toast.error('Transcription failed: ' + (err.message || 'Unknown error'))
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  // ── Stop MediaRecorder ──
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    setIsListening(false)
  }, [])

  // ── Start MediaRecorder (for Capacitor / mobile) ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null

        if (audioChunksRef.current.length === 0) {
          toast.error('No audio recorded')
          return
        }

        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        await transcribeBlob(blob)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsListening(true)
      toast.info('Recording... tap mic to stop', { duration: 2000 })
    } catch (err) {
      console.error('[SpeechButton] getUserMedia error:', err)
      setIsListening(false)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Microphone permission denied. Please grant mic access in your device settings.')
      } else {
        toast.error('Mic error: ' + (err.message || 'Unknown'))
      }
    }
  }, [transcribeBlob])

  // ── Desktop: Web Speech API ──
  const startSpeechRecognition = useCallback(() => {
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
        setIsListening(false)
        recognitionRef.current = null
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied.')
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
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
      toast.error('Speech recognition unavailable')
    }
  }, [lang])

  // ── Toggle handler ──
  const handleClick = useCallback(() => {
    if (isTranscribing) return

    // Currently recording → stop
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
        recognitionRef.current = null
        setIsListening(false)
      } else {
        stopRecording()
      }
      return
    }

    // Desktop: use SpeechRecognition
    if (hasSpeechRecognition()) {
      startSpeechRecognition()
      return
    }

    // Mobile/Capacitor: use MediaRecorder + Whisper
    if ('MediaRecorder' in window && navigator.mediaDevices?.getUserMedia) {
      startRecording()
      return
    }

    toast.error('Voice input not supported on this device')
  }, [isListening, isTranscribing, startSpeechRecognition, startRecording, stopRecording])

  const useMobile = !hasSpeechRecognition()

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size}
        onClick={handleClick}
        disabled={isTranscribing}
        className={`${
          isTranscribing
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : isListening
              ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
              : 'bg-blue-500 text-white hover:bg-blue-600'
        } ${className}`}
        title={isTranscribing ? 'Transcribing...' : isListening ? 'Tap to stop' : 'Tap to speak'}
      >
        {isTranscribing
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : isListening
            ? <MicOff className="w-4 h-4" />
            : <Mic className="w-4 h-4" />}
      </Button>

      {/* Hidden file input as last-resort fallback — only used if MediaRecorder fails */}
      {useMobile && (
        <input
          type="file"
          accept="audio/*"
          capture="user"
          className="hidden"
          id="speech-fallback-input"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) transcribeBlob(file)
            e.target.value = ''
          }}
        />
      )}
    </>
  )
}
