'use client'

import { useState, useCallback, useRef } from 'react'
import { useWavesurfer } from '@wavesurfer/react'

interface RecordingPreviewProps {
  audioUrl: string
}

export default function RecordingPreview({ audioUrl }: RecordingPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [volume, setVolume] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    waveColor: '#d1d5db', // gray-300
    progressColor: '#6366f1', // indigo-500
    cursorColor: '#4f46e5', // indigo-600
    url: audioUrl,
    height: 60,
    barWidth: 2,
    barGap: 3,
    barRadius: 4,
  })

  // Set up events
  if (wavesurfer) {
    wavesurfer.once('ready', () => {
      // Any logic on ready
    })
    wavesurfer.on('play', () => setIsPlaying(true))
    wavesurfer.on('pause', () => setIsPlaying(false))
    wavesurfer.on('finish', () => setIsPlaying(false))
  }

  const onPlayPause = useCallback(() => {
    wavesurfer && wavesurfer.playPause()
  }, [wavesurfer])

  const onSpeedChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const speed = parseFloat(e.target.value)
    setPlaybackSpeed(speed)
    wavesurfer && wavesurfer.setPlaybackRate(speed)
  }, [wavesurfer])

  const onVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    wavesurfer && wavesurfer.setVolume(vol)
  }, [wavesurfer])

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div ref={containerRef} className="mb-4" />
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayPause}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={onVolumeChange}
              className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="speed-select">Speed:</label>
          <select
            id="speed-select"
            value={playbackSpeed}
            onChange={onSpeedChange}
            className="bg-gray-50 border border-gray-300 rounded-md py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
        </div>
      </div>
    </div>
  )
}
