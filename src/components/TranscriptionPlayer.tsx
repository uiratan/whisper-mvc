'use client'

import { useRef, useEffect } from 'react'

interface TranscriptionPlayerProps {
  audioUrl: string
  onTimeUpdate?: (currentTime: number) => void
  seekToTime?: number  // External seek control
}

export default function TranscriptionPlayer({
  audioUrl,
  onTimeUpdate,
  seekToTime
}: TranscriptionPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  // Handle external seeking
  useEffect(() => {
    if (seekToTime !== undefined && audioRef.current) {
      // Only seek if audio is loaded
      if (!isNaN(audioRef.current.duration)) {
        audioRef.current.currentTime = seekToTime
      }
    }
  }, [seekToTime])

  // Handle time updates
  const handleTimeUpdate = () => {
    if (audioRef.current && onTimeUpdate) {
      onTimeUpdate(audioRef.current.currentTime)
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        controls
        onTimeUpdate={handleTimeUpdate}
        className="w-full"
      />
    </div>
  )
}
