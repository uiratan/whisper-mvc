/**
 * Export utilities for transcription results
 * Provides functions to generate SRT/TXT formats and trigger browser downloads
 */

export interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

/**
 * Format seconds to HH:MM:SS,mmm (SRT timestamp format)
 * Note: SRT uses comma before milliseconds, not period
 */
function formatSRTTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const milliseconds = Math.floor((seconds % 1) * 1000)

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds
    .toString()
    .padStart(3, '0')}`
}

/**
 * Generate SRT (SubRip) subtitle format from transcription segments
 *
 * SRT format structure:
 * 1
 * 00:00:00,000 --> 00:00:05,000
 * First subtitle text
 *
 * 2
 * 00:00:05,000 --> 00:00:10,000
 * Second subtitle text
 *
 * @param segments - Array of transcription segments with timestamps
 * @param filename - Original filename (not used in output, kept for future metadata)
 * @returns SRT formatted string
 */
export function generateSRT(
  segments: TranscriptionSegment[],
  filename?: string
): string {
  if (!segments || segments.length === 0) {
    return ''
  }

  return segments
    .map((segment, index) => {
      const sequenceNumber = index + 1 // SRT uses 1-based indexing
      const startTime = formatSRTTimestamp(segment.start)
      const endTime = formatSRTTimestamp(segment.end)
      const text = segment.text.trim()

      return `${sequenceNumber}\n${startTime} --> ${endTime}\n${text}\n`
    })
    .join('\n')
}

/**
 * Generate plain text format from transcription
 * Simply returns the text as-is without any formatting
 *
 * @param transcriptionText - The full transcription text
 * @returns Plain text string
 */
export function generateTXT(transcriptionText: string): string {
  return transcriptionText
}

/**
 * Trigger browser download of content as a file
 * Creates a Blob, generates an Object URL, and programmatically clicks a download link
 *
 * @param content - The file content as a string
 * @param filename - The filename for the download
 * @param mimeType - MIME type for the Blob (e.g., 'text/plain', 'application/x-subrip')
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  // Create a Blob from the content
  const blob = new Blob([content], { type: mimeType })

  // Generate a temporary URL for the blob
  const url = URL.createObjectURL(blob)

  // Create a temporary anchor element
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'

  // Add to document, click, and remove
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  // Clean up the Object URL to free memory
  URL.revokeObjectURL(url)
}
