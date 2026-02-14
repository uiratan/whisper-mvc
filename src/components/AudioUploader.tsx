'use client'

import { useState } from 'react'

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

  const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB in bytes

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/ogg']
    if (!validTypes.includes(file.type)) {
      setStatusMessage('Invalid file type. Please select a .wav, .mp3, or .ogg file.')
      setStatusType('error')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setStatusMessage(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
      setStatusType('error')
      return
    }

    setSelectedFile(file)
    setStatusMessage('')
    setStatusType('idle')
    setUploadProgress(0)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setStatusMessage('Uploading...')
    setStatusType('idle')

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      // Using XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percentComplete)
        }
      })

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response: UploadResponse = JSON.parse(xhr.responseText)
          setStatusMessage(response.message || 'Upload successful!')
          setStatusType('success')
          setUploadProgress(100)

          // Store transcription if present
          if (response.transcription) {
            setTranscription(response.transcription)
          }
        } else {
          const errorResponse: UploadResponse = JSON.parse(xhr.responseText)
          setStatusMessage(errorResponse.message || 'Upload failed')
          setStatusType('error')
          setUploadProgress(0)
        }
        setIsUploading(false)
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        setStatusMessage('Network error occurred during upload')
        setStatusType('error')
        setUploadProgress(0)
        setIsUploading(false)
      })

      // Send the request
      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    } catch (error) {
      setStatusMessage('Upload failed. Please try again.')
      setStatusType('error')
      setUploadProgress(0)
      setIsUploading(false)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setStatusMessage('')
    setStatusType('idle')
    setTranscription(null)
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upload Audio File</h2>
        <p className="text-gray-600 text-sm">
          Select an audio file (.wav, .mp3, or .ogg) up to 25MB
        </p>
      </div>

      {/* File Selection */}
      <div className="mb-6">
        <label
          htmlFor="audio-file-input"
          className="block w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center">
            {/* File Icon */}
            <svg
              className="w-12 h-12 text-gray-400 mb-3"
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
            <p className="text-gray-700 font-medium">Click to select audio file</p>
            <p className="text-gray-500 text-sm mt-1">WAV, MP3, or OGG</p>
          </div>
        </label>
        <input
          id="audio-file-input"
          type="file"
          accept=".wav,.mp3,.ogg,audio/wav,audio/mpeg,audio/ogg"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-800 truncate">{selectedFile.name}</p>
              <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
            </div>
            {!isUploading && (
              <button
                onClick={handleClear}
                className="ml-4 text-gray-500 hover:text-red-600 transition-colors"
                title="Clear selection"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Upload Progress</span>
            <span className="text-sm font-medium text-indigo-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
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
          className={`mb-6 p-4 rounded-lg ${
            statusType === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : statusType === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          <p className="text-sm font-medium">{statusMessage}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
          !selectedFile || isUploading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95'
        }`}
      >
        {isUploading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
          'Upload File'
        )}
      </button>

      {/* Transcription Results */}
      {transcription && (
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Transcription</h3>

          {/* Full Text */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Full Text</h4>
            <p className="text-gray-900 leading-relaxed">{transcription.text}</p>
          </div>

          {/* Timestamped Segments */}
          {transcription.segments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Timestamped Segments</h4>
              <div className="space-y-2">
                {transcription.segments.map((segment, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex-shrink-0 text-sm font-mono text-indigo-600 font-medium">
                      [{formatTimestamp(segment.start)} - {formatTimestamp(segment.end)}]
                    </div>
                    <div className="flex-1 text-gray-800">
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
