'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import LiveVisualizer from './LiveVisualizer'
import RecordingPreview from './RecordingPreview'
import TranscriptionPlayer from './TranscriptionPlayer'
import { generateSRT, generateTXT, downloadFile } from '../utils/exportUtils'

interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

interface TranscriptionResult {
  text: string
  segments: TranscriptionSegment[]
}

interface UploadResponse {
  success: boolean
  fileName?: string
  filePath?: string
  fileSize?: number
  message: string
  transcription?: TranscriptionResult
}

export default function AudioUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [statusType, setStatusType] = useState<'idle' | 'success' | 'error'>('idle')
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('record')
  const [copyMode, setCopyMode] = useState<'text' | 'timestamps' | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0)
  const [seekToTime, setSeekToTime] = useState<number | undefined>(undefined)
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null)
  const [currentPhase, setCurrentPhase] = useState<'upload' | 'conversion' | 'transcription' | 'complete'>('upload')

  const resultsRef = useRef<HTMLDivElement>(null)
  const recorder = useVoiceRecorder()
  const abortControllerRef = useRef<AbortController | null>(null)

  const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB in bytes

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
      setStatusMessage('')
      setStatusType('idle')
      setUploadProgress(0)
      // Discard any recording if a file is dropped
      if (recorder.state !== 'idle') {
        recorder.discardRecording()
      }
    } else if (fileRejections.length > 0) {
      const error = fileRejections[0].errors[0]
      let message = 'Invalid file.'
      if (error.code === 'file-too-large') {
        message = `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
      } else if (error.code === 'file-invalid-type') {
        message = 'Invalid file type. Please select an audio file.'
      }
      setStatusMessage(message)
      setStatusType('error')
    }
  }, [MAX_FILE_SIZE, recorder])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': [
        '.wav', '.mp3', '.ogg', '.m4a', '.mp4', '.aac', '.webm', '.3gp', '.3g2'
      ]
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isUploading || recorder.state === 'recording'
  })

  // Handle successful recording - convert to File and set as selectedFile
  useEffect(() => {
    if (recorder.state === 'preview' && recorder.recordingBlob) {
      const extension = recorder.recordingBlob.type.includes('webm') ? 'webm' : 'mp4'
      const file = new File(
        [recorder.recordingBlob], 
        `recording-${new Date().toISOString().replace(/:/g, '-')}.${extension}`, 
        { type: recorder.recordingBlob.type }
      )
      setSelectedFile(file)
      setStatusMessage('')
      setStatusType('idle')
      setUploadProgress(0)
    }
  }, [recorder.state, recorder.recordingBlob])

  // Scroll to results when transcription is ready
  useEffect(() => {
    if (transcription && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [transcription])

  // Clean up audio URL when component unmounts or new file is selected
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      // Abort any ongoing upload
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [audioUrl])

  const handleStartRecording = async () => {
    try {
      await recorder.startRecording()
      setStatusMessage('')
      setStatusType('idle')
    } catch (err: any) {
      if (err.message === 'BROWSER_UNSUPPORTED') {
        setStatusMessage('Recording is not supported in this browser or environment (ensure you are using HTTPS).')
      } else {
        setStatusMessage('Could not access microphone. Please check permissions.')
      }
      setStatusType('error')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setCurrentPhase('upload')
    setStatusMessage('Connecting...')
    setStatusType('idle')
    setAudioUrl(null)
    setActiveSegmentIndex(null)
    setCurrentPlaybackTime(0)

    const formData = new FormData()
    formData.append('file', selectedFile)

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController()

    // Connection timeout (30 seconds)
    const connectionTimeout = setTimeout(() => {
      if (abortControllerRef.current) {
        console.warn('SSE connection timeout, aborting')
        abortControllerRef.current.abort()
      }
    }, 30000)

    try {
      // Try SSE streaming first
      setStatusMessage('Uploading...')
      const response = await fetch('/api/upload?stream=true', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      })

      // Clear connection timeout once we get a response
      clearTimeout(connectionTimeout)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Check if response is SSE
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('text/event-stream')) {
        // SSE streaming mode
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let lastProgressUpdate = Date.now()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            lastProgressUpdate = Date.now()
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))

                  // Handle error events
                  if (data.error) {
                    setStatusMessage(data.message || 'Processing failed')
                    setStatusType('error')
                    setUploadProgress(0)
                    setIsUploading(false)
                    reader.cancel()
                    return
                  }

                  // Update phase and progress
                  if (data.phase) {
                    setCurrentPhase(data.phase)
                    setUploadProgress(data.progress || 0)

                    // Update status message based on phase
                    if (data.phase === 'upload') {
                      setStatusMessage('Uploading...')
                    } else if (data.phase === 'conversion') {
                      setStatusMessage('Converting audio...')
                    } else if (data.phase === 'transcription') {
                      setStatusMessage('Transcribing audio...')
                    } else if (data.phase === 'complete') {
                      setStatusMessage('Complete!')
                      setStatusType('success')

                      // Store transcription result
                      if (data.transcription) {
                        setTranscription(data.transcription)
                        // Create audio URL from the selected file for playback
                        if (selectedFile) {
                          const url = URL.createObjectURL(selectedFile)
                          setAudioUrl(url)
                        }
                      }

                      setIsUploading(false)
                    }
                  }
                } catch (parseError) {
                  console.error('Failed to parse SSE data:', parseError)
                  // Don't fail on individual parse errors, continue processing
                }
              }
            }
          }
        } catch (streamError: any) {
          if (streamError.name === 'AbortError') {
            console.log('SSE stream canceled by user')
            return
          }
          throw streamError
        }

        // If we reach here without completing, something went wrong
        if (currentPhase !== 'complete' && isUploading) {
          throw new Error('SSE stream ended unexpectedly')
        }
      } else {
        // Fallback to JSON response (legacy mode)
        console.log('SSE not available, using legacy JSON mode')
        const result: UploadResponse = await response.json()

        if (result.success && result.transcription) {
          setTranscription(result.transcription)
          setStatusMessage(result.message || 'Upload successful!')
          setStatusType('success')
          setUploadProgress(100)
          setCurrentPhase('complete')

          if (selectedFile) {
            const url = URL.createObjectURL(selectedFile)
            setAudioUrl(url)
          }
        } else {
          setStatusMessage(result.message || 'Upload failed')
          setStatusType('error')
          setUploadProgress(0)
        }

        setIsUploading(false)
      }
    } catch (error: any) {
      // Clear connection timeout on error
      clearTimeout(connectionTimeout)

      // Don't show error if request was aborted (user canceled)
      if (error.name === 'AbortError') {
        console.log('Upload canceled by user')
        setStatusMessage('Upload canceled')
        setStatusType('idle')
        setUploadProgress(0)
        setIsUploading(false)
        return
      }

      console.error('Upload error:', error)

      // Provide more specific error messages
      let errorMessage = 'Upload failed. Please try again.'
      if (error.message?.includes('HTTP error! status: 413')) {
        errorMessage = 'File too large. Maximum size is 25MB.'
      } else if (error.message?.includes('HTTP error! status: 400')) {
        errorMessage = 'Invalid file format or request.'
      } else if (error.message?.includes('timeout') || error.message?.includes('Network')) {
        errorMessage = 'Connection timeout. Please check your network and try again.'
      }

      setStatusMessage(errorMessage)
      setStatusType('error')
      setUploadProgress(0)
      setIsUploading(false)
    }
  }

  const handleClear = () => {
    // Abort any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setSelectedFile(null)
    setUploadProgress(0)
    setCurrentPhase('upload')
    setStatusMessage('')
    setStatusType('idle')
    setTranscription(null)
    setAudioUrl(null)
    setActiveSegmentIndex(null)
    setCurrentPlaybackTime(0)
    recorder.discardRecording()
    // Reset file input
    const fileInput = document.getElementById('audio-file-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Extract original filename without extension for export naming
  const getBaseFilename = (): string => {
    return selectedFile?.name.replace(/\.[^.]+$/, '') || 'transcription'
  }

  // Handle seeking to a specific timestamp
  const handleSeekToTimestamp = (seconds: number) => {
    setSeekToTime(seconds)
    // Reset seekToTime after applying to allow re-seeking to same time
    setTimeout(() => setSeekToTime(undefined), 100)
  }

  // Handle time updates from audio player
  const handleTimeUpdate = (currentTime: number) => {
    setCurrentPlaybackTime(currentTime)
    // Find which segment is currently playing
    if (transcription) {
      const index = transcription.segments.findIndex(
        seg => currentTime >= seg.start && currentTime < seg.end
      )
      setActiveSegmentIndex(index >= 0 ? index : null)
    }
  }

  // Copy plain text to clipboard
  const handleCopyText = async () => {
    if (!transcription) return
    try {
      await navigator.clipboard.writeText(transcription.text)
      setCopyMode('text')
      setTimeout(() => setCopyMode(null), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  // Copy text with timestamps
  const handleCopyWithTimestamps = async () => {
    if (!transcription) return
    try {
      const formattedText = transcription.segments
        .map((segment) => `[${formatTimestamp(segment.start)}] ${segment.text}`)
        .join('\n')
      await navigator.clipboard.writeText(formattedText)
      setCopyMode('timestamps')
      setTimeout(() => setCopyMode(null), 2000)
    } catch (err) {
      console.error('Failed to copy timestamped text:', err)
    }
  }

  // Export transcription as plain text file
  const handleExportTXT = () => {
    if (!transcription) return
    const content = generateTXT(transcription.text)
    const filename = `${getBaseFilename()}.txt`
    downloadFile(content, filename, 'text/plain')
  }

  // Export transcription as SRT subtitle file
  const handleExportSRT = () => {
    if (!transcription) return
    const content = generateSRT(transcription.segments, getBaseFilename())
    const filename = `${getBaseFilename()}.srt`
    downloadFile(content, filename, 'text/plain')
  }

  const isRecording = recorder.state === 'recording'
  const isPaused = recorder.state === 'paused'
  const isPreview = recorder.state === 'preview'

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
      {/* Header */}
      <div className="mb-3 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1 sm:mb-2 text-center sm:text-left">Provide Audio</h2>
        <p className="text-gray-600 text-xs sm:text-sm text-center sm:text-left">
          Upload a file or record directly in the browser (Max 25MB)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto justify-center sm:justify-start">
        <button
          onClick={() => setActiveTab('record')}
          disabled={isUploading}
          className={`py-2 px-3 sm:px-4 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'record'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-indigo-400'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Live Recording
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          disabled={isRecording || isUploading}
          className={`py-2 px-3 sm:px-4 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'upload'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-indigo-400'
          } ${(isRecording || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Upload File
        </button>
      </div>

      {/* Input Area */}
      <div className="mb-4 sm:mb-6">
        {activeTab === 'upload' ? (
          <div
            {...getRootProps()}
            className={`relative block w-full p-6 sm:p-8 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50 scale-[1.02] shadow-md'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} id="audio-file-input" />
            <div className="flex flex-col items-center justify-center text-center">
              <svg
                className={`w-10 h-10 sm:w-12 sm:h-12 mb-3 transition-colors ${
                  isDragActive ? 'text-indigo-500' : 'text-gray-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <p className="text-gray-700 font-medium text-sm sm:text-base">
                {isDragActive ? 'Drop the audio file here' : 'Drag & drop or click to select audio'}
              </p>
              <p className="text-gray-500 text-xs mt-1">WAV, MP3, OGG, M4A, etc.</p>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-8 bg-gray-50 text-center">
            {!recorder.isSupported ? (
              <div className="flex flex-col items-center py-2 sm:py-4">
                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-full">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-gray-800 font-medium mb-1 text-sm sm:text-base">Recording Unsupported</p>
                <p className="text-gray-600 text-[10px] sm:text-sm max-w-xs">
                  Requires Secure Context (HTTPS/localhost).
                </p>
              </div>
            ) : isPreview ? (
              <div className="flex flex-col items-center">
                <p className="text-indigo-600 font-semibold mb-2 text-base">Captured!</p>
                {recorder.recordingUrl && (
                  <RecordingPreview audioUrl={recorder.recordingUrl} />
                )}
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  <button
                    onClick={() => recorder.startFresh()}
                    className="py-1.5 px-3 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-xs"
                  >
                    Redo
                  </button>
                  <button
                    onClick={() => recorder.discardRecording()}
                    className="py-1.5 px-3 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-xs"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="mb-2 sm:mb-4">
                  <span className="text-2xl sm:text-3xl font-mono text-gray-800">
                    {formatTimestamp(recorder.duration)}
                  </span>
                </div>
                
                {isRecording || isPaused ? (
                  <div className="w-full mb-4 sm:mb-6">
                    {recorder.mediaStream && (
                      <LiveVisualizer stream={recorder.mediaStream} />
                    )}
                  </div>
                ) : (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-full bg-indigo-50">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 013-3h1a3 3 0 013 3v3a3 3 0 01-3 3h-1a3 3 0 01-3-3v-3z" />
                    </svg>
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  {!isRecording && !isPaused ? (
                    <button
                      onClick={handleStartRecording}
                      className="flex items-center gap-2 py-2 px-6 sm:py-3 sm:px-8 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-all shadow-md active:scale-95 text-sm sm:text-base"
                    >
                      <span className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse" />
                      Start
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => recorder.stopRecording()}
                        className="py-2 px-6 sm:py-3 sm:px-8 bg-gray-800 text-white rounded-full font-semibold hover:bg-black transition-all shadow-md active:scale-95 text-sm sm:text-base"
                      >
                        Stop
                      </button>
                      <button
                        onClick={isPaused ? recorder.resumeRecording : recorder.pauseRecording}
                        className="py-2 px-6 sm:py-3 sm:px-8 bg-white border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all active:scale-95 text-sm sm:text-base"
                      >
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected File Info */}
      {selectedFile && !isRecording && (
        <div className="mb-4 sm:mb-6 p-2 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate text-xs sm:text-base" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="text-[10px] sm:text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
            </div>
            {!isUploading && (
              <button
                onClick={handleClear}
                className="ml-4 text-gray-500 hover:text-red-600 transition-colors"
                title="Clear selection"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploadProgress > 0 && (
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-sm font-medium text-gray-700">
              {currentPhase === 'upload' && 'Uploading...'}
              {currentPhase === 'conversion' && 'Converting to WAV...'}
              {currentPhase === 'transcription' && 'Transcribing...'}
              {currentPhase === 'complete' && 'Complete!'}
            </span>
            <span className="text-[10px] sm:text-sm font-medium text-indigo-600">{uploadProgress}%</span>
          </div>

          {/* Phase indicators */}
          <div className="flex gap-2 mb-2">
            <div
              className={`flex-1 h-1.5 rounded ${
                currentPhase === 'upload'
                  ? 'bg-indigo-600 animate-pulse'
                  : ['conversion', 'transcription', 'complete'].includes(currentPhase)
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`}
              title="Upload"
            />
            <div
              className={`flex-1 h-1.5 rounded ${
                currentPhase === 'conversion'
                  ? 'bg-indigo-600 animate-pulse'
                  : ['transcription', 'complete'].includes(currentPhase)
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`}
              title="Conversion"
            />
            <div
              className={`flex-1 h-1.5 rounded ${
                currentPhase === 'transcription'
                  ? 'bg-indigo-600 animate-pulse'
                  : currentPhase === 'complete'
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`}
              title="Transcription"
            />
          </div>

          {/* Main progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`mb-4 sm:mb-6 p-2 sm:p-4 rounded-lg ${
            statusType === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : statusType === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          <p className="text-[10px] sm:text-sm font-medium text-center">{statusMessage}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading || isRecording}
        className={`w-full py-2.5 sm:py-3 px-6 rounded-lg font-semibold text-white transition-all text-sm sm:text-base ${
          !selectedFile || isUploading || isRecording
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95'
        }`}
      >
        {isUploading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Uploading...
          </span>
        ) : (
          isPreview ? 'Confirm & Upload' : 'Upload File'
        )}
      </button>

      {/* Transcription Results */}
      {transcription && (
        <div ref={resultsRef} className="mt-6 sm:mt-8 border-t border-gray-200 pt-6 sm:pt-8 scroll-mt-8">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Transcription</h3>

          {/* Audio Player */}
          {audioUrl && (
            <div className="mb-6">
              <TranscriptionPlayer
                audioUrl={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                seekToTime={seekToTime}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Copy Text Only */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 py-2 px-3 sm:px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-indigo-400 transition-all text-xs sm:text-sm font-medium"
            >
              {copyMode === 'text' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              <span>Copy Text</span>
            </button>

            {/* Copy With Timestamps */}
            <button
              onClick={handleCopyWithTimestamps}
              className="flex items-center gap-1.5 py-2 px-3 sm:px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-indigo-400 transition-all text-xs sm:text-sm font-medium"
            >
              {copyMode === 'timestamps' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              <span>Copy + Timestamps</span>
            </button>

            {/* Export TXT */}
            <button
              onClick={handleExportTXT}
              className="flex items-center gap-1.5 py-2 px-3 sm:px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-xs sm:text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export TXT</span>
            </button>

            {/* Export SRT */}
            <button
              onClick={handleExportSRT}
              className="flex items-center gap-1.5 py-2 px-3 sm:px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-xs sm:text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export SRT</span>
            </button>
          </div>

          {/* Full Text */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-1 sm:mb-2">Full Text</h4>
            <p className="text-gray-900 leading-relaxed text-sm sm:text-base">
              {transcription.segments.map((segment, index) => (
                <span
                  key={index}
                  onClick={() => handleSeekToTimestamp(segment.start)}
                  className={`cursor-pointer hover:bg-indigo-100 transition-colors ${
                    activeSegmentIndex === index ? 'bg-indigo-200 font-medium' : ''
                  }`}
                >
                  {segment.text}
                  {index < transcription.segments.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
          </div>

          {/* Timestamped Segments */}
          {transcription.segments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Segments</h4>
              <div className="space-y-2">
                {transcription.segments.map((segment, index) => (
                  <div
                    key={index}
                    onClick={() => handleSeekToTimestamp(segment.start)}
                    className={`flex gap-3 sm:gap-4 p-2 sm:p-3 bg-white border rounded-lg cursor-pointer transition-all ${
                      activeSegmentIndex === index
                        ? 'bg-indigo-100 border-indigo-400'
                        : 'border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex-shrink-0 text-[10px] sm:text-sm font-mono text-indigo-700 font-semibold">
                      [{formatTimestamp(segment.start)}]
                    </div>
                    <div className="flex-1 text-gray-900 text-xs sm:text-sm">
                      {segment.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
