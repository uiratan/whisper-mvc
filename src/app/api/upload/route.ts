import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Allowed MIME types
const ALLOWED_TYPES = ['audio/wav', 'audio/mpeg', 'audio/ogg']

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

    // Return success response
    return NextResponse.json(
      {
        success: true,
        fileName: uniqueFilename,
        filePath: filePath,
        fileSize: file.size,
        message: 'File uploaded successfully'
      },
      { status: 200 }
    )
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
