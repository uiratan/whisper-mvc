# Requirements: Whisper Test - Milestone 2.0

**Milestone:** 2.0 (Enhanced Input & Output)
**Core Value:** Facilitar a entrada de áudio (gravação direta/drag-drop) e a utilidade dos resultados (exportação/cópia).

## v2 Requirements

### Enhanced Input (Goal: Input Efficiency)

- **EINP-01: Drag-and-Drop Support**
  - User can drag audio files anywhere onto the upload component.
  - UI provides clear visual feedback (overlay/border change) during drag.
  - Uses `react-dropzone` for robust event handling.

- **EINP-02: Native Browser Recording**
  - User can record audio directly using a "Record" button.
  - Uses native `MediaRecorder` API.
  - Automatically handles microphone permissions and browser codec variability.
  - Audio is sent to the existing `/api/upload` endpoint after recording stops.

- **EINP-03: Real-time Recording Feedback**
  - Display a live waveform visualizer (Canvas-based) during recording.
  - Display a simple timer showing recording duration (MM:SS).

### Enhanced Output (Goal: Result Utility)

- **EOUT-01: Copy to Clipboard**
  - One-click button to copy the full transcription text to the clipboard.

- **EOUT-02: Export to TXT/SRT**
  - Buttons to download the transcription as a `.txt` file (raw text).
  - Button to download the transcription as a `.srt` file (with timestamps).
  - SRT formatting must follow standard `HH:MM:SS,mmm` syntax.

### UI/UX Polishing

- **UIUX-01: Enhanced Status Feedback**
  - Clearer differentiation between "Uploading", "Converting", and "Transcribing" states.
- **UIUX-02: Segment Interaction**
  - Visual polish for timestamped segments (better contrast/typography).

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EINP-01 | Phase 3 | Pending |
| EINP-02 | Phase 4 | Pending |
| EINP-03 | Phase 4 | Pending |
| EOUT-01 | Phase 5 | Pending |
| EOUT-02 | Phase 5 | Pending |
| UIUX-01 | Phase 5 | Pending |
| UIUX-02 | Phase 5 | Pending |

## Out of Scope (Still)

| Feature | Reason |
|---------|--------|
| Multi-file upload | Focus on single-file workflow for now |
| Real-time transcription | Complexity; whisper.cpp batch processing preferred |
| Mobile App (Native) | Keep it as a PWA/Web app |

---
*Requirements defined: 2026-02-14*
