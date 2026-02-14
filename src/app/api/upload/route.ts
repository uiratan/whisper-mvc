import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import { spawn } from 'child_process'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Allowed MIME types
const ALLOWED_TYPES = ['audio/wav', 'audio/mpeg', 'audio/ogg']

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
  return new Promise((resolve, reject) => {
    // Assume whisper.cpp binary is in PATH or at ./whisper.cpp
    // Try common locations: ./whisper.cpp, whisper.cpp (in PATH), ./main (whisper.cpp default binary name)
    const whisperBinary = process.env.WHISPER_CPP_PATH || 'whisper.cpp'

    // Use base model for balance of speed and accuracy (from PROJECT.md constraints)
    const modelPath = process.env.WHISPER_MODEL_PATH || 'models/ggml-base.bin'

    const args = [
      '-m', modelPath,
      '-f', wavPath,
      '--output-json',
      '--output-file', wavPath.replace('.wav', '')  // Output base path (whisper adds .json)
    ]

    const whisper = spawn(whisperBinary, args)

    let stderr = ''

    whisper.stderr.on('data', (data) => {
      stderr += data.toString()
      console.log(`[Whisper] ${data.toString().trim()}`)
    })

    whisper.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`Whisper.cpp failed with code ${code}: ${stderr}`))
        return
      }

      // Read JSON output file
      const jsonPath = wavPath.replace('.wav', '.json')
      try {
        const jsonData = await readFile(jsonPath, 'utf-8')
        const result = JSON.parse(jsonData)

        // whisper.cpp JSON format has "transcription" array with segments
        const segments: TranscriptionSegment[] = result.transcription?.map((seg: any) => ({
          start: seg.offsets.from / 100, // Convert centiseconds to seconds
          end: seg.offsets.to / 100,
          text: seg.text.trim()
        })) || []

        const fullText = segments.map(s => s.text).join(' ')

        resolve({
          text: fullText,
          segments
        })
      } catch (err) {
        reject(new Error(`Failed to parse whisper.cpp output: ${err}`))
      }
    })

    whisper.on('error', (err) => {
      reject(new Error(`Failed to spawn whisper.cpp: ${err.message}`))
    })
  })
}

export async function POST(request: NextRequest) {
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
    const filePath = path.join(UPLOAD_DIR, uniqueFilename)

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
          fileName: uniqueFilename,
          filePath: filePath,
          fileSize: file.size,
          message: 'File uploaded and transcribed successfully',
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
  }
}
