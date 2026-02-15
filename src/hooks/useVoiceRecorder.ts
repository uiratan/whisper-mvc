'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type RecordingState = 'idle' | 'recording' | 'paused' | 'preview'

export interface UseVoiceRecorderReturn {
  state: RecordingState
  recordingBlob: Blob | null
  recordingUrl: string | null
  duration: number
  mediaStream: MediaStream | null
  isSupported: boolean
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  discardRecording: () => void
  startFresh: () => Promise<void>
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle')
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState<number>(0)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [isSupported, setIsSupported] = useState<boolean>(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    setIsSupported(supported)
  }, [])

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
    ]
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('[VoiceRecorder] Using MIME type:', type)
        return type
      }
    }
    console.warn('[VoiceRecorder] No supported MIME type found, using default')
    return ''
  }

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const discardRecording = useCallback(() => {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl)
    }
    setRecordingBlob(null)
    setRecordingUrl(null)
    setDuration(0)
    setState('idle')
    chunksRef.current = []
  }, [recordingUrl])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop()
      stopTimer()
      
      // Stop all tracks in the stream
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop())
        setMediaStream(null)
      }
    }
  }, [state, mediaStream, stopTimer])

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('BROWSER_UNSUPPORTED')
    }

    try {
      // Clear previous if any
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl)
      }
      chunksRef.current = []
      setDuration(0)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })
      setMediaStream(stream)

      const mimeType = getSupportedMimeType()
      const options: MediaRecorderOptions = mimeType
        ? {
            mimeType,
            audioBitsPerSecond: 128000  // 128kbps for good quality
          }
        : { audioBitsPerSecond: 128000 }

      const recorder = new MediaRecorder(stream, options)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          console.log(`[VoiceRecorder] Chunk received: ${event.data.size} bytes (total chunks: ${chunksRef.current.length})`)
        } else {
          console.warn('[VoiceRecorder] Empty chunk received')
        }
      }

      recorder.onerror = (event) => {
        console.error('[VoiceRecorder] MediaRecorder error:', event)
        setState('idle')
      }

      recorder.onstop = () => {
        console.log(`[VoiceRecorder] Recording stopped. Total chunks: ${chunksRef.current.length}`)
        const blob = new Blob(chunksRef.current, { type: mimeType || recorder.mimeType })
        console.log(`[VoiceRecorder] Final blob size: ${blob.size} bytes`)
        const url = URL.createObjectURL(blob)
        setRecordingBlob(blob)
        setRecordingUrl(url)
        setState('preview')
      }

      mediaRecorderRef.current = recorder

      // Request data every 1 second to avoid losing large buffers
      recorder.start(1000)
      console.log('[VoiceRecorder] Recording started with 1s timeslice')

      setState('recording')
      startTimer()
    } catch (err: any) {
      console.error('Failed to start recording', err)
      setState('idle')
      throw err
    }
  }, [recordingUrl, startTimer])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause()
      setState('paused')
      stopTimer()
    }
  }, [state, stopTimer])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume()
      setState('recording')
      startTimer()
    }
  }, [state, startTimer])

  const startFresh = useCallback(async () => {
    discardRecording()
    await startRecording()
  }, [discardRecording, startRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl)
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop())
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    recordingBlob,
    recordingUrl,
    duration,
    mediaStream,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
    startFresh,
  }
}
