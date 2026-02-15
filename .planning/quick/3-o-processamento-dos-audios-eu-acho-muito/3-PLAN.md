---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/api/upload/route.ts
  - .env.local
autonomous: true

must_haves:
  truths:
    - "Audio transcription completes noticeably faster"
    - "User sees processing time improvement"
  artifacts:
    - path: "src/app/api/upload/route.ts"
      provides: "Optimized Whisper.cpp transcription with parallel processing and faster model"
      min_lines: 260
    - path: ".env.local"
      provides: "Whisper configuration with optimized settings"
      min_lines: 8
  key_links:
    - from: "src/app/api/upload/route.ts"
      to: "whisper.cpp binary"
      via: "spawn with optimized flags"
      pattern: "spawn.*whisper"
---

<objective>
Optimize audio processing performance to reduce transcription time.

**Purpose:** User reports audio processing is too slow. Current implementation uses sequential FFmpeg conversion + Whisper.cpp transcription with base.en model. Multiple optimization opportunities exist.

**Output:** Faster transcription through: (1) parallel FFmpeg+Whisper pipeline, (2) Whisper performance flags (-t for threads, -pp for prompt processing), (3) smaller 'tiny.en' model for quick mode option.
</objective>

<execution_context>
@/home/uira/.claude/get-shit-done/workflows/execute-plan.md
@/home/uira/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
Current state: Sequential processing (upload → FFmpeg WAV conversion → Whisper transcription).
- Uses base.en model (148MB, accurate but slower)
- No parallel processing between conversion and transcription
- No thread optimization flags for Whisper
- No GPU acceleration flags

Available models:
- tiny.en (fastest, lowest accuracy)
- base.en (current, balanced)
- small.en, medium.en (slower, more accurate)

@src/app/api/upload/route.ts
@.env.local
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Whisper performance flags and model configuration</name>
  <files>src/app/api/upload/route.ts</files>
  <files>.env.local</files>
  <action>
**Update transcribeAudio function in route.ts:**
1. Add thread optimization to Whisper args: `-t ${process.env.WHISPER_THREADS || '4'}` (uses multiple CPU cores)
2. Add prompt processing flag: `--no-speech-thr 0.6` (skip silent segments faster)
3. Add speed optimization flag: `-pp` (parallel processing when possible)
4. Add beam size flag: `-bs 1` (reduces beam search for faster decoding at slight accuracy cost)

**Add to .env.local:**
```
# Performance settings
WHISPER_THREADS=4
WHISPER_MODEL_FAST=/home/uira/git/ai/whisper.cpp/models/for-tests-ggml-tiny.en.bin
```

**Why these flags:**
- `-t 4`: Uses 4 CPU threads instead of single-threaded (4x potential speedup)
- `--no-speech-thr 0.6`: Skips processing silence/noise segments
- `-bs 1`: Greedy decoding instead of beam search (faster, minimal quality loss)
- `-pp`: Enables parallel processing of audio chunks

**What NOT to do:**
- Don't remove JSON output flag (--output-json) - needed for segment timestamps
- Don't use tiny model by default - keep base.en as default, add tiny as optional fast mode
- Don't remove diagnostic logging - helpful for debugging
  </action>
  <verify>
1. Check args array includes new flags: `grep -A 15 "const args" src/app/api/upload/route.ts | grep -E "(-t|-bs|--no-speech-thr)"`
2. Verify .env.local has WHISPER_THREADS: `grep WHISPER_THREADS .env.local`
3. Test transcription speed improvement with sample audio
  </verify>
  <done>
- Whisper.cpp spawn includes thread flag `-t` with value from env (default 4)
- Whisper args include beam size `-bs 1` for faster decoding
- Whisper args include `--no-speech-thr 0.6` to skip silence
- .env.local defines WHISPER_THREADS=4 and WHISPER_MODEL_FAST path
- Processing speed measurably faster (log timestamps show reduction)
  </done>
</task>

<task type="auto">
  <name>Task 2: Stream FFmpeg output directly to Whisper (eliminate WAV write)</name>
  <files>src/app/api/upload/route.ts</files>
  <action>
**Optimize file I/O:**
Current: Upload → Save → FFmpeg → Save WAV → Whisper → Delete files
Better: Upload → Save → FFmpeg (in-memory or pipe to Whisper if possible) → Whisper → Delete

Since Whisper.cpp requires file input (no stdin pipe support), optimize by:
1. Use temp WAV location in memory-backed tmpfs if available: Check if `/dev/shm` exists, use it for temp WAV files
2. Add FFmpeg faster-processing flags: `-threads 2` (parallel conversion), `-preset ultrafast`
3. Remove unnecessary diagnostic `execSync` calls in production (move to debug env var)

**Implementation:**
```typescript
const tempDir = existsSync('/dev/shm') ? '/dev/shm' : UPLOAD_DIR
const tempWavPath = path.join(tempDir, `temp-${Date.now()}.wav`)
```

For convertToWav:
- Add `.addOption('-threads', '2')` before `.toFormat('wav')`
- This parallelizes FFmpeg audio conversion

**Diagnostic optimization:**
Wrap diagnostic logging in env check:
```typescript
if (process.env.WHISPER_DEBUG === 'true') {
  // diagnostic execSync calls
}
```

**Why:**
- `/dev/shm` is RAM-backed filesystem (10-100x faster I/O than disk)
- FFmpeg threads=2 enables parallel audio processing
- Removing diagnostic overhead in production saves 200-500ms per request
  </action>
  <verify>
1. Check tempDir uses /dev/shm when available: `grep "dev/shm" src/app/api/upload/route.ts`
2. Verify FFmpeg uses threads: `grep -A 5 "ffmpeg(inputPath)" src/app/api/upload/route.ts | grep threads`
3. Confirm diagnostics wrapped in env check: `grep "WHISPER_DEBUG" src/app/api/upload/route.ts`
4. Test end-to-end: Upload audio, check console logs show faster processing time
  </verify>
  <done>
- Temp WAV files use `/dev/shm` when available (RAM disk)
- FFmpeg conversion uses `-threads 2` flag
- Diagnostic execSync calls only run when WHISPER_DEBUG=true
- Total processing time reduced (compare before/after with same audio file)
- Console logs show time savings in conversion and transcription steps
  </done>
</task>

</tasks>

<verification>
**Functional verification:**
1. Upload same test audio file before and after changes
2. Compare processing time from upload start to transcription complete (check browser network tab + server logs)
3. Verify transcription accuracy remains acceptable (text should be same quality)
4. Check all segments have proper timestamps (no regression)

**Performance verification:**
```bash
# Test with a sample audio file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-audio.wav" \
  --trace-time
```

Expected improvements:
- FFmpeg conversion: 20-40% faster (threads + RAM disk)
- Whisper transcription: 2-4x faster (multi-threading + beam size optimization)
- Total pipeline: 50-70% reduction in processing time
</verification>

<success_criteria>
- [ ] Audio transcription completes in ~50-70% of original time
- [ ] Transcription quality/accuracy unchanged (same text output for same input)
- [ ] All timestamps present and accurate in segments
- [ ] No errors or crashes with various audio formats
- [ ] Server logs show performance improvement (timing logs)
</success_criteria>

<output>
After completion, create `.planning/quick/3-o-processamento-dos-audios-eu-acho-muito/3-SUMMARY.md`
</output>
