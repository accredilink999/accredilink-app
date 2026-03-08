/**
 * useSpeechToText — Universal speech-to-text hook.
 *
 * Strategy:
 * 1. On Capacitor native (iOS/Android): @capacitor-community/speech-recognition
 * 2. On desktop Chrome: Web Speech API (SpeechRecognition)
 * 3. Fallback: MediaRecorder + Whisper transcription
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { invokeFunction } from '@/api/functions'
import { toast } from 'sonner'

const isCapacitor = () => !!window.Capacitor?.isNativePlatform?.()

/** Check if Web Speech API is available (desktop Chrome only) */
function hasSpeechRecognition() {
  if (isCapacitor()) return false
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

/** Lazy-load the Capacitor speech plugin only on native */
let _nativeSR = null
async function getNativeSpeechRecognition() {
  if (_nativeSR) return _nativeSR
  const mod = await import('@capacitor-community/speech-recognition')
  _nativeSR = mod.SpeechRecognition
  return _nativeSR
}

export default function useSpeechToText({ onResult, onError, lang = 'en-GB', continuous = false } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const isListeningRef = useRef(false)
  const nativeListeningRef = useRef(false)

  // Keep refs in sync with latest callbacks to avoid stale closures
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)
  useEffect(() => { onResultRef.current = onResult }, [onResult])
  useEffect(() => { onErrorRef.current = onError }, [onError])

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
      if (nativeListeningRef.current) {
        getNativeSpeechRecognition().then(SR => SR.stop()).catch(() => {})
      }
    }
  }, [])

  const handleError = useCallback((msg) => {
    console.warn('[SpeechToText] Error:', msg)
    isListeningRef.current = false
    nativeListeningRef.current = false
    setIsListening(false)
    setIsTranscribing(false)
    if (onErrorRef.current) {
      onErrorRef.current(msg)
    } else {
      toast.error(msg)
    }
  }, [])

  /** Process a captured audio blob via Whisper (fallback only) */
  const transcribeAudioBlob = useCallback(async (blob) => {
    setIsTranscribing(true)
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result?.split(',')[1]
          if (result) resolve(result)
          else reject(new Error('Failed to encode audio'))
        }
        reader.onerror = () => reject(new Error('Failed to read audio file'))
        reader.readAsDataURL(blob)
      })

      toast.info('Transcribing your speech...', { duration: 5000, id: 'transcribing' })

      const result = await invokeFunction('transcribeAudio', {
        audioBase64: base64,
        mimeType: blob.type || 'audio/webm',
      })

      toast.dismiss('transcribing')

      if (result?.transcript) {
        if (onResultRef.current) onResultRef.current(result.transcript)
        toast.success('Speech added', { duration: 1500 })
      } else {
        handleError('No speech detected. Please try again.')
      }
    } catch (err) {
      toast.dismiss('transcribing')
      console.error('[SpeechToText] Transcription error:', err)
      handleError('Transcription failed: ' + (err.message || 'Please try again.'))
    } finally {
      setIsTranscribing(false)
    }
  }, [handleError])

  /** Start listening — picks the best available method */
  const startListening = useCallback(async () => {
    if (isListeningRef.current) return

    // ── Method 1: Capacitor native speech recognition ──
    if (isCapacitor()) {
      try {
        const SR = await getNativeSpeechRecognition()

        const { available } = await SR.available()
        if (!available) {
          handleError('Speech recognition not available on this device')
          return
        }

        const perms = await SR.requestPermissions()
        if (perms.speechRecognition !== 'granted') {
          handleError('Speech recognition permission denied. Please allow in device settings.')
          return
        }

        isListeningRef.current = true
        nativeListeningRef.current = true
        setIsListening(true)
        toast.info('Listening... tap mic to stop', { duration: 3000 })

        const result = await SR.start({
          language: lang,
          maxResults: 3,
          partialResults: false,
          popup: false,
        })

        isListeningRef.current = false
        nativeListeningRef.current = false
        setIsListening(false)

        if (result?.matches?.length > 0) {
          if (onResultRef.current) onResultRef.current(result.matches[0])
          toast.success('Speech added', { duration: 1500 })
        } else {
          handleError('No speech detected. Please try again.')
        }
        return
      } catch (err) {
        isListeningRef.current = false
        nativeListeningRef.current = false
        setIsListening(false)
        console.error('[SpeechToText] Native speech error:', err)
        if (err?.message?.includes('canceled') || err?.message?.includes('Canceled')) return
        handleError('Speech error: ' + (err.message || 'Unknown'))
        return
      }
    }

    // ── Method 2: Web Speech API (desktop Chrome) ──
    if (hasSpeechRecognition()) {
      try {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SR()
        recognition.continuous = continuous
        recognition.interimResults = false
        recognition.lang = lang

        recognition.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript
          if (onResultRef.current) onResultRef.current(transcript)
        }

        recognition.onerror = (event) => {
          console.warn('[SpeechToText] SpeechRecognition error:', event.error)
          const errorMap = {
            'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
            'no-speech': 'No speech detected. Please try again.',
            'network': 'Network error during speech recognition.',
            'audio-capture': 'No microphone found. Please check your device.',
          }
          handleError(errorMap[event.error] || `Speech error: ${event.error}`)
        }

        recognition.onend = () => {
          isListeningRef.current = false
          setIsListening(false)
          recognitionRef.current = null
        }

        recognition.start()
        recognitionRef.current = recognition
        isListeningRef.current = true
        setIsListening(true)
        return
      } catch (err) {
        console.warn('[SpeechToText] SpeechRecognition failed:', err)
      }
    }

    // ── Method 3: MediaRecorder + Whisper (desktop fallback) ──
    if ('MediaRecorder' in window && 'mediaDevices' in navigator) {
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

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop())
          streamRef.current = null

          if (audioChunksRef.current.length === 0) {
            handleError('No audio recorded')
            return
          }

          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          })

          await transcribeAudioBlob(audioBlob)
        }

        recorder.start()
        mediaRecorderRef.current = recorder
        isListeningRef.current = true
        setIsListening(true)
        toast.info('Recording... Tap mic to stop', { duration: 2000 })
        return
      } catch (err) {
        console.error('[SpeechToText] MediaRecorder error:', err)
      }
    }

    handleError('Speech input is not supported on this device/browser.')
  }, [handleError, lang, continuous, transcribeAudioBlob])

  /** Stop listening */
  const stopListening = useCallback(async () => {
    // Native Capacitor speech
    if (nativeListeningRef.current) {
      try {
        const SR = await getNativeSpeechRecognition()
        await SR.stop()
      } catch {}
      nativeListeningRef.current = false
    }
    // Web Speech API
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    // MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    isListeningRef.current = false
    setIsListening(false)
  }, [])

  /** Toggle listening on/off */
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening()
    } else {
      startListening()
    }
  }, [startListening, stopListening])

  return { isListening, isTranscribing, startListening, stopListening, toggleListening, supported: true }
}
