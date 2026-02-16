/**
 * useSpeechToText — Universal speech-to-text hook.
 *
 * Strategy:
 * 1. On desktop Chrome: Use Web Speech API (SpeechRecognition)
 * 2. On Capacitor / mobile: Use native file capture (opens device recorder)
 *    then transcribe via Groq Whisper
 * 3. Fallback: MediaRecorder + Whisper (if getUserMedia works)
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { invokeFunction } from '@/api/functions'
import { toast } from 'sonner'

const isCapacitor = () => !!window.Capacitor?.isNativePlatform?.()

/** Check if native SpeechRecognition API is available AND functional */
function hasSpeechRecognition() {
  // Exclude Capacitor WebViews — SpeechRecognition exists but doesn't work
  if (isCapacitor()) return false
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

export default function useSpeechToText({ onResult, onError, lang = 'en-GB', continuous = false } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const isListeningRef = useRef(false)
  const fileInputRef = useRef(null)

  // Keep refs in sync with latest callbacks to avoid stale closures
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)
  useEffect(() => { onResultRef.current = onResult }, [onResult])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  // Create hidden file input for native audio capture (mobile/Capacitor)
  useEffect(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*'
    input.capture = 'microphone'
    input.style.display = 'none'
    input.setAttribute('id', 'speech-to-text-file-input')
    document.body.appendChild(input)
    fileInputRef.current = input

    input.addEventListener('change', handleFileSelected)

    return () => {
      input.removeEventListener('change', handleFileSelected)
      if (input.parentNode) input.parentNode.removeChild(input)
    }
  }, [])

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
    console.warn('[SpeechToText] Error:', msg)
    isListeningRef.current = false
    setIsListening(false)
    setIsTranscribing(false)
    if (onErrorRef.current) {
      onErrorRef.current(msg)
    } else {
      toast.error(msg)
    }
  }, [])

  /** Process a captured audio file (from file input or MediaRecorder) */
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

  /** Handle file selected from native audio capture */
  const handleFileSelected = useCallback((event) => {
    const file = event.target?.files?.[0]
    if (file) {
      transcribeAudioBlob(file)
    }
    // Reset the input so the same file can be selected again
    if (event.target) event.target.value = ''
  }, [transcribeAudioBlob])

  // Re-attach event listener when handler changes
  useEffect(() => {
    const input = fileInputRef.current
    if (!input) return
    input.removeEventListener('change', handleFileSelected)
    input.addEventListener('change', handleFileSelected)
    return () => input.removeEventListener('change', handleFileSelected)
  }, [handleFileSelected])

  /** Start listening — picks the best available method */
  const startListening = useCallback(async () => {
    if (isListeningRef.current) return

    // ── Method 1: Native SpeechRecognition (desktop Chrome only) ──
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

    // ── Method 2: On Capacitor/mobile — use native file capture ──
    if (isCapacitor() || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
      if (fileInputRef.current) {
        fileInputRef.current.click()
        return
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
        // Fall through to file input as last resort
      }
    }

    // ── Last resort: file input on any platform ──
    if (fileInputRef.current) {
      fileInputRef.current.click()
      return
    }

    handleError('Speech input is not supported on this device/browser.')
  }, [handleError, lang, continuous, transcribeAudioBlob])

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
