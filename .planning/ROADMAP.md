# ROADMAP: Whisper Test

**Project:** Upload audio via web → transcribe locally with whisper.cpp → display with timestamps

**Phases:** 2 | **Depth:** quick | **Coverage:** 7/7 requirements mapped

---

## Phase 1: Frontend & Audio Upload

**Goal:** Users can select and upload audio files with visual feedback

**Plans:** 2 plans in 2 waves

Plans:
- [ ] 01-01-PLAN.md — Next.js project setup with TypeScript and Tailwind
- [ ] 01-02-PLAN.md — Audio upload UI and API endpoint

**Requirements:**
- UPLD-01: User can select and upload an audio file (.wav, .mp3, .ogg)
- UPLD-02: Page shows upload progress/status indicator
- DISP-02: Page shows processing/loading state

**Dependencies:** None (foundation phase)

**Success Criteria:**

1. User can click file input and select audio file (formats: .wav, .mp3, .ogg)
2. Upload progress displays to user (percentage or visual indicator)
3. Loading spinner/message shows while backend processes
4. Page is responsive and functional on load

**Description:**
Set up Next.js project scaffolding, create file upload UI component, wire upload to backend API endpoint, implement progress tracking client-side, add loading state management. No transcription logic yet — just accept and acknowledge the audio file.

---

## Phase 2: Transcription & Results Display

**Goal:** Users see transcribed audio with timestamps after processing

**Requirements:**
- TRNS-01: Backend receives uploaded audio and invokes whisper.cpp binary
- TRNS-02: Backend converts audio to WAV 16kHz mono if needed
- TRNS-03: Backend returns transcription result with timestamps
- DISP-01: Page displays transcribed text with timestamps after processing

**Dependencies:** Phase 1 (needs upload endpoint to receive files)

**Success Criteria:**

1. Backend API accepts audio file and calls whisper.cpp with tiny/base model
2. Audio is converted to WAV 16kHz mono before transcription
3. Transcription returns with word-level timestamps
4. Frontend displays text and timestamps on page after processing completes
5. User sees error handling if whisper.cpp fails or audio is invalid

**Description:**
Implement whisper.cpp integration via child process spawning, add audio format conversion (ffmpeg or similar), parse whisper.cpp output, return structured response with timestamps, display results on frontend with proper formatting and error handling.

---

## Progress

| Phase | Status | Requirements | Criteria |
|-------|--------|--------------|----------|
| 1 | Pending | 3 | 4 |
| 2 | Pending | 4 | 5 |

**Coverage:** 7/7 requirements mapped ✓

---

*Roadmap created: 2026-02-14*
