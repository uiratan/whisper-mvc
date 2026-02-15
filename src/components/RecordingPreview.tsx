'use client'

interface RecordingPreviewProps {
  audioUrl: string
}

/**
 * Simple audio preview component using native HTML5 audio controls
 * Maintains consistent UI with TranscriptionPlayer
 */
export default function RecordingPreview({ audioUrl }: RecordingPreviewProps) {
  return (
    <div className="w-full bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
      <audio
        controls
        src={audioUrl}
        className="w-full"
        preload="metadata"
      />
    </div>
  )
}
