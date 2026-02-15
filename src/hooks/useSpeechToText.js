/**
 * useSpeechToText — Universal speech-to-text hook.
 *
 * Strategy:
 * 1. Try the Web Speech API (SpeechRecognition) first — works on Chrome desktop.
 * 2. Fall back to recording audio via MediaRecorder + transcribing via
 *    Groq Whisper API (works everywhere: mobile, WebViews, all browsers).
 *
 * Usage:
 *   const { isListening, startListening, stopListening, supported } = useSpeechToText({
 *     onResult: (text) => setInput(text),
 *     onError: (err) => toast.error(err),
 *     lang: 'en-GB',
 *   });
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { invokeFunction } from '@/api/functions'
import { toast } from 'sonner'

/** Check if native SpeechRecognition API is available AND functional */
function hasSpeechRecognition() {
  // Exclude iOS WebView (Capacitor) — SpeechRecognition exists but doesn't work
  if (window.Capacitor?.isNativePlatform?.()) return false
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

/** Check if MediaRecorder is available for audio capture */
function hasMediaRecorder() {
  return 'MediaRecorder' in window && 'mediaDevices' in navigator
}

export default function useSpeechToText({ onResult, onError, lang = 'en-GB', continuous = false } = {}) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)

  const supported = hasSpeechRecognition() || hasMediaRecorder()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop() } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const handleError = useCallback((msg) => {
    setIsListening(false)
    if (onError) {
      onError(msg)
    } else {
      toast.error(msg)
    }
  }, [onError])

  /** Start listening — picks the best available method */
  const startListening = useCallback(async () => {
    if (isListening) return

    // ── Method 1: Native SpeechRecognition ──
    if (hasSpeechRecognition()) {
      try {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SR()
        recognition.continuous = continuous
        recognition.interimResults = false
        recognition.lang = lang

        recognition.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript
          if (onResult) onResult(transcript)
        }

        recognition.onerror = (event) => {
          const errorMap = {
            'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
            'no-speech': 'No speech detected. Please try again.',
            'network': 'Network error during speech recognition.',
            'audio-capture': 'No microphone found. Please check your device.',
          }
          handleError(errorMap[event.error] || `Speech error: ${event.error}`)
        }

        recognition.onend = () => {
          setIsListening(false)
          recognitionRef.current = null
        }

        recognition.start()
        recognitionRef.current = recognition
        setIsListening(true)
        return
      } catch (err) {
        console.warn('SpeechRecognition failed, falling back to audio recording:', err)
      }
    }

    // ── Method 2: Record audio + Whisper transcription ──
    if (hasMediaRecorder()) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        // Prefer webm, fall back to whatever is supported
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/mp4')
              ? 'audio/mp4'
              : ''

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
        audioChunksRef.current = []

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        recorder.onstop = async () => {
          // Stop mic stream
          stream.getTracks().forEach(t => t.stop())
          streamRef.current = null

          if (audioChunksRef.current.length === 0) {
            handleError('No audio recorded')
            return
          }

          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          })

          // Convert to base64
          const reader = new FileReader()
          reader.onloadend = async () => {
            const base64 = reader.result.split(',')[1]
            if (!base64) {
              handleError('Failed to encode audio')
              return
            }

            try {
              toast.info('Transcribing...', { duration: 2000 })
              const result = await invokeFunction('transcribeAudio', {
                audioBase64: base64,
                mimeType: recorder.mimeType || 'audio/webm',
              })

              if (result?.transcript) {
                if (onResult) onResult(result.transcript)
              } else {
                handleError('No speech detected. Please try again.')
              }
            } catch (err) {
              console.error('Whisper transcription error:', err)
              handleError('Transcription failed. Please try again.')
            }
          }
          reader.readAsDataURL(audioBlob)
        }

        recorder.start()
        mediaRecorderRef.current = recorder
        setIsListening(true)
        return
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          handleError('Microphone access denied. Please allow microphone permissions in your browser/device settings.')
        } else {
          handleError('Could not access microphone: ' + (err.message || 'Unknown error'))
        }
        return
      }
    }

    handleError('Speech input is not supported on this device/browser.')
  }, [isListening, onResult, handleError, lang, continuous])

  /** Stop listening */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    setIsListening(false)
  }, [])

  /** Toggle listening on/off */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return { isListening, startListening, stopListening, toggleListening, supported }
}
