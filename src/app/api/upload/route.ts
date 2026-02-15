import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, rename, unlink } from 'fs/promises'
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

async function convertToWav(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.[^.]+$/, '.wav')

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec('pcm_s16le')
      .toFormat('wav')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath)
  })
}

async function transcribeAudio(wavPath: string): Promise<TranscriptionResult> {
  const whisperBinary = process.env.WHISPER_CPP_PATH || 'whisper.cpp'
  const modelPath = process.env.WHISPER_MODEL_PATH || 'models/ggml-base.bin'

  // Diagnostic: Check files and sizes
  try {
    const { execSync } = require('child_process');
    console.log(`[Diagnostic] Binary info: ${execSync(`ls -lh ${whisperBinary}`).toString()}`);
    console.log(`[Diagnostic] Model info: ${execSync(`ls -lh ${modelPath}`).toString()}`);
    console.log(`[Diagnostic] WAV info: ${execSync(`ls -lh ${wavPath}`).toString()}`);
    // Try to run help instead of version
    console.log(`[Diagnostic] Binary help (first line): ${execSync(`${whisperBinary} -h 2>&1 | head -n 1`).toString()}`);
  } catch (diagError: any) {
    console.warn(`[Diagnostic Failed] ${diagError.message}`);
  }

  // Simplify filename for whisper.cpp (it can be picky with paths)
  const tempWavName = `temp-${Date.now()}.wav`
  const tempWavPath = path.join(UPLOAD_DIR, tempWavName)
  await rename(wavPath, tempWavPath)

  return new Promise((resolve, reject) => {
    const args = [
      '-m', modelPath,
      '-f', tempWavPath,
      '--output-json',
      '--output-file', tempWavPath.replace('.wav', '')
    ]

    console.log(`[Whisper] Executing: ${whisperBinary} ${args.join(' ')}`)
    const whisper = spawn(whisperBinary, args)

    let stderr = ''
    let stdout = ''

    whisper.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    whisper.stderr.on('data', (data) => {
      const msg = data.toString()
      stderr += msg
      console.log(`[Whisper STDERR] ${msg.trim()}`)
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      console.log('[Upload API] No file provided')
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`[Upload API] File received: ${file.name}, type: ${file.type}, size: ${file.size}`)

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log(`[Upload API] Invalid file type: ${file.type}`)
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
      return NextResponse.json(
        {
          success: false,
          message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        },
        { status: 413 }
      )
    }

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
    // CLEANUP: Delete original uploaded file if it exists
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
