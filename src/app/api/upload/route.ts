import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, copyFile, unlink } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import { spawn } from 'child_process'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Allowed MIME types - expanded to support mobile recordings
const ALLOWED_TYPES = [
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/aac',
  'audio/x-aac',
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/3gpp',
  'audio/3gpp2'
]

interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

interface TranscriptionResult {
  text: string
  segments: TranscriptionSegment[]
}

interface ProgressCallback {
  (data: { phase: string; progress: number }): void
}

// SSE response helper
function createSSEResponse(): [ReadableStream, (data: any) => void, () => void] {
  let controller: ReadableStreamDefaultController;
  const stream = new ReadableStream({
    start(c) {
      controller = c;
    }
  });
  const send = (data: any) => {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(payload));
  };
  const close = () => controller.close();
  return [stream, send, close];
}

async function convertToWav(inputPath: string, onProgress?: ProgressCallback): Promise<string> {
  const outputPath = inputPath.replace(/\.[^.]+$/, '.wav')

  return new Promise((resolve, reject) => {
    let progressReported = false

    ffmpeg(inputPath)
      .addOption('-threads', '2')  // Parallel audio conversion
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec('pcm_s16le')
      .toFormat('wav')
      .on('progress', (progress) => {
        // FFmpeg progress callback - estimate based on time processed
        if (onProgress && progress.percent) {
          onProgress({ phase: 'conversion', progress: Math.min(Math.round(progress.percent), 99) })
          progressReported = true
        }
      })
      .on('end', () => {
        if (onProgress && !progressReported) {
          onProgress({ phase: 'conversion', progress: 100 })
        }
        resolve(outputPath)
      })
      .on('error', (err) => reject(err))
      .save(outputPath)
  })
}

async function transcribeAudio(wavPath: string, onProgress?: ProgressCallback): Promise<TranscriptionResult> {
  const whisperBinary = process.env.WHISPER_CPP_PATH || 'whisper.cpp'
  const modelPath = process.env.WHISPER_MODEL_PATH || 'models/ggml-base.bin'

  // Diagnostic: Check files and sizes (only in debug mode)
  if (process.env.WHISPER_DEBUG === 'true') {
    try {
      const { execSync } = require('child_process');
      console.log(`[Diagnostic] Binary info: ${execSync(`ls -lh ${whisperBinary}`).toString()}`);
      console.log(`[Diagnostic] Model info: ${execSync(`ls -lh ${modelPath}`).toString()}`);
      console.log(`[Diagnostic] WAV info: ${execSync(`ls -lh ${wavPath}`).toString()}`);
      console.log(`[Diagnostic] Binary help (first line): ${execSync(`${whisperBinary} -h 2>&1 | head -n 1`).toString()}`);
    } catch (diagError: any) {
      console.warn(`[Diagnostic Failed] ${diagError.message}`);
    }
  }

  // Use RAM-backed filesystem for temp files (faster I/O)
  const tempDir = existsSync('/dev/shm') ? '/dev/shm' : UPLOAD_DIR
  const tempWavName = `temp-${Date.now()}.wav`
  let tempWavPath = path.join(tempDir, tempWavName)

  // Copy to RAM disk (can't use rename across filesystems)
  if (tempDir !== UPLOAD_DIR) {
    await copyFile(wavPath, tempWavPath)
    await unlink(wavPath)  // Delete original after successful copy
  } else {
    // Same filesystem, just use original path to avoid unnecessary copy
    tempWavPath = wavPath
  }

  return new Promise((resolve, reject) => {
    const args = [
      '-m', modelPath,
      '-f', tempWavPath,
      '--output-json',
      '--output-file', tempWavPath.replace('.wav', ''),
      '-t', process.env.WHISPER_THREADS || '4',        // Multi-threading for faster processing
      '-bs', '1',                                       // Beam size 1 for greedy decoding (faster)
      '--no-speech-thold', '0.6',                       // Skip silent segments
      '-pp'                                             // Enable parallel processing
    ]

    console.log(`[Whisper] Executing: ${whisperBinary} ${args.join(' ')}`)
    const whisper = spawn(whisperBinary, args)

    let stderr = ''
    let stdout = ''
    let lastProgress = 0
    const progressStartTime = Date.now()

    whisper.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    whisper.stderr.on('data', (data) => {
      const msg = data.toString()
      stderr += msg
      console.log(`[Whisper STDERR] ${msg.trim()}`)

      // Parse progress from whisper.cpp stderr output
      if (onProgress) {
        // Look for progress indicators in whisper.cpp output
        // Whisper doesn't output precise percentages, so we use heuristics

        // Progress pattern 1: whisper_print_progress_callback output
        const progressMatch = msg.match(/progress\s*=\s*(\d+)%/);
        if (progressMatch) {
          const percent = parseInt(progressMatch[1], 10)
          lastProgress = Math.min(percent, 99)
          onProgress({ phase: 'transcription', progress: lastProgress })
        }

        // Progress pattern 2: Time-based estimation (first 10 seconds of processing)
        const elapsed = Date.now() - progressStartTime
        if (elapsed < 10000 && lastProgress === 0) {
          // Gradually increase from 0 to 50% over first 10 seconds
          const estimatedProgress = Math.min(Math.floor((elapsed / 10000) * 50), 50)
          if (estimatedProgress > lastProgress) {
            lastProgress = estimatedProgress
            onProgress({ phase: 'transcription', progress: lastProgress })
          }
        }

        // Progress pattern 3: Detect processing activity
        if (msg.includes('processing') || msg.includes('load time') || msg.includes('mel time')) {
          if (lastProgress < 20) {
            lastProgress = 20
            onProgress({ phase: 'transcription', progress: lastProgress })
          }
        }

        // Progress pattern 4: Detect near completion
        if (msg.includes('whisper_print_timings')) {
          lastProgress = 95
          onProgress({ phase: 'transcription', progress: lastProgress })
        }
      }
    })

    whisper.on('close', async (code) => {
      const jsonPath = tempWavPath.replace('.wav', '.json')
      
      try {
        if (code !== 0) {
          reject(new Error(`Whisper.cpp failed with code ${code}: ${stderr}`))
          return
        }

        const jsonData = await readFile(jsonPath, 'utf-8')
        const result = JSON.parse(jsonData)

        const segments: TranscriptionSegment[] = result.transcription?.map((seg: any) => ({
          start: seg.offsets.from / 1000,  // Convert milliseconds to seconds
          end: seg.offsets.to / 1000,      // Convert milliseconds to seconds
          text: seg.text.trim()
        })) || []

        const fullText = segments.map(s => s.text).join(' ')

        resolve({
          text: fullText,
          segments
        })
      } catch (err) {
        reject(new Error(`Failed to parse whisper.cpp output: ${err}`))
      } finally {
        // CLEANUP: Delete temporary WAV and JSON files
        try {
          if (existsSync(tempWavPath)) await unlink(tempWavPath)
          if (existsSync(jsonPath)) await unlink(jsonPath)
          console.log('[Cleanup] Temporary transcription files deleted')
        } catch (cleanupError) {
          console.warn('[Cleanup] Error deleting transcription files:', cleanupError)
        }
      }
    })

    whisper.on('error', (err) => {
      reject(new Error(`Failed to spawn whisper.cpp: ${err.message}`))
    })
  })
}

export async function POST(request: NextRequest) {
  let filePath: string | null = null;

  try {
    console.log('[Upload API] Received upload request')

    // Check if client wants SSE streaming (via query param or Accept header)
    const url = new URL(request.url)
    const wantsSSE = url.searchParams.get('stream') === 'true' ||
                     request.headers.get('Accept')?.includes('text/event-stream')

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      console.log('[Upload API] No file provided')
      if (wantsSSE) {
        const [stream, send, close] = createSSEResponse()
        send({ error: true, message: 'No file provided' })
        close()
        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        })
      }
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`[Upload API] File received: ${file.name}, type: ${file.type}, size: ${file.size}`)

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log(`[Upload API] Invalid file type: ${file.type}`)
      if (wantsSSE) {
        const [stream, send, close] = createSSEResponse()
        send({ error: true, message: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}` })
        close()
        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        })
      }
      return NextResponse.json(
        {
          success: false,
          message: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log(`[Upload API] File too large: ${file.size} bytes`)
      if (wantsSSE) {
        const [stream, send, close] = createSSEResponse()
        send({ error: true, message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` })
        close()
        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        })
      }
      return NextResponse.json(
        {
          success: false,
          message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        },
        { status: 413 }
      )
    }

    // SSE MODE - Stream progress events
    if (wantsSSE) {
      const [stream, send, close] = createSSEResponse()

      // Start processing in async context
      ;(async () => {
        try {
          // Create upload directory if it doesn't exist
          if (!existsSync(UPLOAD_DIR)) {
            console.log(`[Upload API] Creating upload directory: ${UPLOAD_DIR}`)
            await mkdir(UPLOAD_DIR, { recursive: true })
          }

          // Generate unique filename with timestamp
          const timestamp = Date.now()
          const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const uniqueFilename = `${timestamp}-${sanitizedFilename}`
          filePath = path.join(UPLOAD_DIR, uniqueFilename)

          // Convert file to buffer and save
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)

          console.log(`[Upload API] Saving file to: ${filePath}`)
          await writeFile(filePath, buffer)

          console.log(`[Upload API] File saved successfully: ${uniqueFilename}`)

          // PHASE 1: Upload complete
          send({ phase: 'upload', progress: 100 })

          // PHASE 2: Convert to WAV format
          console.log('[Upload API] Converting audio to WAV 16kHz mono...')
          send({ phase: 'conversion', progress: 0 })

          const wavPath = await convertToWav(filePath, send)
          console.log(`[Upload API] Converted to: ${wavPath}`)

          send({ phase: 'conversion', progress: 100 })

          // PHASE 3: Transcribe with whisper.cpp
          console.log('[Upload API] Starting transcription...')
          send({ phase: 'transcription', progress: 0 })

          const transcription = await transcribeAudio(wavPath, send)
          console.log('[Upload API] Transcription complete')

          // PHASE 4: Complete - send final result
          send({
            phase: 'complete',
            progress: 100,
            transcription: transcription,
            success: true,
            message: 'File processed and transcribed successfully'
          })

        } catch (error: any) {
          console.error('[Upload API] Error during processing:', error)

          // Determine specific error type
          let errorMessage = 'Audio processing failed'
          if (error.message?.includes('spawn')) {
            errorMessage = 'Transcription service unavailable. Please ensure whisper.cpp is installed.'
          } else if (error.message?.includes('Whisper.cpp failed')) {
            errorMessage = `Transcription failed: ${error.message}`
          } else if (error.message?.includes('parse')) {
            errorMessage = 'Failed to parse transcription output'
          } else if (error.message?.toLowerCase().includes('ffmpeg')) {
            errorMessage = 'Audio conversion failed. Please ensure the file is a valid audio format.'
          }

          send({ error: true, message: errorMessage })
        } finally {
          // CLEANUP: Delete original uploaded file if it exists
          if (filePath && existsSync(filePath)) {
            try {
              await unlink(filePath)
              console.log('[Cleanup] Original upload file deleted')
            } catch (cleanupError) {
              console.warn('[Cleanup] Error deleting original file:', cleanupError)
            }
          }
          close()
        }
      })()

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }

    // LEGACY MODE - Non-streaming JSON response (backward compatibility)
    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      console.log(`[Upload API] Creating upload directory: ${UPLOAD_DIR}`)
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`
    filePath = path.join(UPLOAD_DIR, uniqueFilename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log(`[Upload API] Saving file to: ${filePath}`)
    await writeFile(filePath, buffer)

    console.log(`[Upload API] File saved successfully: ${uniqueFilename}`)

    // Convert to WAV format
    try {
      console.log('[Upload API] Converting audio to WAV 16kHz mono...')
      const wavPath = await convertToWav(filePath)
      console.log(`[Upload API] Converted to: ${wavPath}`)

      // Transcribe with whisper.cpp
      console.log('[Upload API] Starting transcription...')
      const transcription = await transcribeAudio(wavPath)
      console.log('[Upload API] Transcription complete')

      // Return success response with transcription
      return NextResponse.json(
        {
          success: true,
          message: 'File processed and transcribed successfully',
          transcription: transcription
        },
        { status: 200 }
      )
    } catch (conversionError: any) {
      console.error('[Upload API] Error during audio processing:', conversionError)

      // Determine specific error type
      let errorMessage = 'Audio processing failed'
      if (conversionError.message?.includes('spawn')) {
        errorMessage = 'Transcription service unavailable. Please ensure whisper.cpp is installed.'
      } else if (conversionError.message?.includes('Whisper.cpp failed')) {
        errorMessage = `Transcription failed: ${conversionError.message}`
      } else if (conversionError.message?.includes('parse')) {
        errorMessage = 'Failed to parse transcription output'
      } else if (conversionError.message?.toLowerCase().includes('ffmpeg')) {
        errorMessage = 'Audio conversion failed. Please ensure the file is a valid audio format.'
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          error: conversionError.message
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Upload API] Error during upload:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during file upload'
      },
      { status: 500 }
    )
  } finally {
    // CLEANUP: Delete original uploaded file if it exists (legacy mode only)
    if (filePath && existsSync(filePath)) {
      try {
        await unlink(filePath)
        console.log('[Cleanup] Original upload file deleted')
      } catch (cleanupError) {
        console.warn('[Cleanup] Error deleting original file:', cleanupError)
      }
    }
  }
}
