---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/api/upload/route.ts
  - src/components/AudioUploader.tsx
autonomous: true

must_haves:
  truths:
    - "User sees real-time progress during upload phase"
    - "User sees real-time progress during conversion phase"
    - "User sees real-time progress during transcription phase"
    - "Progress bar shows current phase name and percentage"
  artifacts:
    - path: "src/app/api/upload/route.ts"
      provides: "SSE endpoint for streaming Whisper progress"
      exports: ["POST"]
      contains: "Server-Sent Events"
    - path: "src/components/AudioUploader.tsx"
      provides: "Progress bar UI with phase indicators"
      min_lines: 700
      contains: "EventSource"
  key_links:
    - from: "src/components/AudioUploader.tsx"
      to: "/api/upload"
      via: "EventSource connection for SSE"
      pattern: "new EventSource"
    - from: "src/app/api/upload/route.ts"
      to: "Whisper stderr output"
      via: "Parse progress from stderr"
      pattern: "whisper\\.stderr\\.on"
---

<objective>
Implement real-time progress tracking with phase indicators (upload, conversion, transcription) using Server-Sent Events to stream Whisper.cpp progress to the UI.

Purpose: Provide user feedback during the long-running transcription process, showing distinct phases and percentage completion.
Output: Enhanced progress bar that updates in real-time as the backend processes audio through upload, conversion, and transcription phases.
</objective>

<execution_context>
@/home/uira/.claude/get-shit-done/workflows/execute-plan.md
@/home/uira/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Current implementation uses XMLHttpRequest for basic upload progress tracking but provides no feedback during conversion or transcription phases (which can take 30+ seconds for longer audio files).

Whisper.cpp outputs progress information to stderr in format like:
- `whisper_print_timings: load time = X ms`
- Progress percentage during processing

Need to capture this output and stream it to the frontend via SSE.
</context>

<tasks>

<task type="auto">
  <name>Add SSE progress streaming to backend</name>
  <files>src/app/api/upload/route.ts</files>
  <action>
    Modify the POST handler to support SSE streaming:

    1. Add SSE response helper at top of file:
    ```typescript
    function createSSEResponse(): [ReadableStream, (data: any) => void, () => void] {
      let controller: ReadableStreamDefaultController;
      const stream = new ReadableStream({
        start(c) { controller = c; }
      });
      const send = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };
      const close = () => controller.close();
      return [stream, send, close];
    }
    ```

    2. Detect if request wants SSE via Accept header or query param `?stream=true`

    3. For SSE requests, return Response with headers:
    - Content-Type: text/event-stream
    - Cache-Control: no-cache
    - Connection: keep-alive

    4. Send progress events during:
    - Upload complete: `{phase: 'upload', progress: 100}`
    - Conversion start: `{phase: 'conversion', progress: 0}`
    - Conversion complete: `{phase: 'conversion', progress: 100}`
    - Transcription start: `{phase: 'transcription', progress: 0}`
    - Transcription progress: Parse whisper stderr for progress indicators (look for percentage patterns or processing frame numbers)
    - Transcription complete: `{phase: 'complete', progress: 100, transcription: {...}}`

    5. In transcribeAudio function, modify whisper.stderr.on('data') to:
    - Parse progress from stderr output
    - Estimate percentage based on processing time or frame count if available
    - Call progress callback: `onProgress?.({phase: 'transcription', progress: N})`

    6. Add optional onProgress callback parameter to transcribeAudio and convertToWav functions

    7. For non-SSE requests (backward compatibility), keep existing JSON response behavior

    Note: Whisper.cpp may not output precise progress percentages. Use heuristics like:
    - First 10 seconds → 20-50% progress
    - Detect "processing" logs and increment progress
    - Final "timings" output → 100% complete
  </action>
  <verify>
    Test SSE endpoint:
    ```bash
    curl -N -H "Accept: text/event-stream" --form "file=@test.wav" http://localhost:3000/api/upload
    ```
    Should output multiple `data: {...}` events with increasing progress values.
  </verify>
  <done>Backend streams progress events through three phases (upload, conversion, transcription) with percentage updates via SSE</done>
</task>

<task type="auto">
  <name>Update frontend to consume SSE progress</name>
  <files>src/components/AudioUploader.tsx</files>
  <action>
    Replace XMLHttpRequest upload logic with EventSource SSE:

    1. Add state for current phase:
    ```typescript
    const [currentPhase, setCurrentPhase] = useState<'upload' | 'conversion' | 'transcription' | 'complete'>('upload')
    ```

    2. In handleUpload, replace XHR with:
    ```typescript
    // First, upload file using fetch to get temporary ID or use FormData directly with SSE
    const formData = new FormData()
    formData.append('file', selectedFile)

    // Upload file first (if needed to get ID), then connect to SSE endpoint
    const eventSource = new EventSource(`/api/upload?stream=true&file=${encodeURIComponent(selectedFile.name)}`)

    // Or use POST with fetch that returns SSE stream URL
    const response = await fetch('/api/upload?stream=true', {
      method: 'POST',
      body: formData
    })

    // Connect to SSE stream from response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const {done, value} = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          setCurrentPhase(data.phase)
          setUploadProgress(data.progress)

          if (data.phase === 'complete' && data.transcription) {
            setTranscription(data.transcription)
            setStatusType('success')
            setStatusMessage('Transcription complete!')
            if (selectedFile) {
              setAudioUrl(URL.createObjectURL(selectedFile))
            }
          }
        }
      }
    }
    ```

    3. Update progress bar UI to show phase indicators:
    ```jsx
    {uploadProgress > 0 && (
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between mb-1 sm:mb-2">
          <span className="text-sm font-medium text-gray-700">
            {currentPhase === 'upload' && 'Uploading...'}
            {currentPhase === 'conversion' && 'Converting to WAV...'}
            {currentPhase === 'transcription' && 'Transcribing...'}
            {currentPhase === 'complete' && 'Complete!'}
          </span>
          <span className="text-sm font-medium text-indigo-600">{uploadProgress}%</span>
        </div>

        {/* Phase indicators */}
        <div className="flex gap-2 mb-2">
          <div className={`flex-1 h-1.5 rounded ${currentPhase === 'upload' ? 'bg-indigo-600' : currentPhase !== 'upload' ? 'bg-green-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1.5 rounded ${currentPhase === 'conversion' ? 'bg-indigo-600 animate-pulse' : ['transcription', 'complete'].includes(currentPhase) ? 'bg-green-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1.5 rounded ${currentPhase === 'transcription' ? 'bg-indigo-600 animate-pulse' : currentPhase === 'complete' ? 'bg-green-500' : 'bg-gray-200'}`} />
        </div>

        {/* Main progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    )}
    ```

    4. Handle cleanup when component unmounts:
    ```typescript
    useEffect(() => {
      return () => {
        // Close EventSource if still open
      }
    }, [])
    ```

    Note: May need to adjust SSE implementation based on Next.js API route capabilities. If EventSource doesn't work with POST requests, consider:
    - Two-step: POST file first, get job ID, then GET SSE stream with job ID
    - Or use fetch with ReadableStream as shown above
  </action>
  <verify>
    1. Start dev server: `npm run dev`
    2. Open browser to localhost:3000
    3. Upload or record an audio file
    4. Click upload and observe:
       - Phase indicators light up sequentially (upload → conversion → transcription)
       - Progress bar percentage increases
       - Phase label updates ("Uploading...", "Converting...", "Transcribing...")
       - Transcription appears when complete
    5. Check browser console for errors
    6. Verify progress updates happen in real-time (not just at end)
  </verify>
  <done>UI displays three-phase progress indicator with real-time percentage updates streamed from backend, showing upload, conversion, and transcription phases</done>
</task>

<task type="auto">
  <name>Add error handling and fallback for SSE</name>
  <files>src/components/AudioUploader.tsx</files>
  <action>
    Add robust error handling for SSE connection:

    1. Wrap SSE logic in try-catch
    2. On SSE error or unsupported browser, fallback to original XHR approach (non-streaming)
    3. Add connection timeout (30 seconds) for SSE handshake
    4. Handle SSE connection errors:
    ```typescript
    eventSource.onerror = (error) => {
      console.warn('SSE connection failed, falling back to polling')
      eventSource.close()
      // Fallback to XHR or polling
    }
    ```

    5. Add loading state messages:
    - "Connecting..." (initial)
    - "Uploading..." (upload phase)
    - "Converting audio..." (conversion phase)
    - "Transcribing audio..." (transcription phase)

    6. Ensure proper cleanup:
    - Close SSE connection on unmount
    - Close on error
    - Close on completion

    7. Test fallback by simulating SSE failure (comment out EventSource support)
  </action>
  <verify>
    1. Test with good connection → should use SSE
    2. Simulate error by breaking SSE endpoint → should fallback gracefully
    3. Check that old browsers or SSE-incompatible scenarios still work
    4. Verify no memory leaks (connections properly closed)
    5. Test rapid uploads (upload new file while one is processing) → should cancel previous SSE
  </verify>
  <done>SSE progress tracking includes error handling, fallback to non-streaming mode if SSE fails, and proper connection cleanup</done>
</task>

</tasks>

<verification>
- [ ] Progress bar shows three distinct phases (upload, conversion, transcription)
- [ ] Progress percentage updates in real-time during transcription (not just 0% → 100%)
- [ ] Phase indicators light up sequentially as processing progresses
- [ ] Transcription appears when phase reaches "complete"
- [ ] SSE connection properly closes after completion or on error
- [ ] Fallback works if SSE is unavailable
- [ ] Multiple uploads don't leak connections or cause conflicts
</verification>

<success_criteria>
User sees real-time feedback showing:
1. Current processing phase with visual indicators
2. Progress percentage that updates during long transcription operations
3. Clear labels for each phase (Upload, Conversion, Transcription)
4. Smooth transitions between phases
5. Graceful error handling if streaming fails
</success_criteria>

<output>
After completion, create `.planning/quick/4-implementar-barra-de-progresso-com-indic/4-SUMMARY.md`
</output>
