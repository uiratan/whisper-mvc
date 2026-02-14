# Requirements: Whisper Test

**Defined:** 2026-02-14
**Core Value:** Upload de um arquivo de áudio e ver a transcrição com timestamps funcionando na tela.

## v1 Requirements

### Upload

- [x] **UPLD-01**: User can select and upload an audio file (.wav, .mp3, .ogg) via the web page
- [x] **UPLD-02**: Page shows upload progress/status indicator

### Transcription

- [ ] **TRNS-01**: Backend receives uploaded audio and invokes whisper.cpp binary with tiny/base model
- [ ] **TRNS-02**: Backend converts audio to WAV 16kHz mono if needed (whisper.cpp requirement)
- [ ] **TRNS-03**: Backend returns transcription result with timestamps to frontend

### Display

- [ ] **DISP-01**: Page displays transcribed text with timestamps after processing
- [x] **DISP-02**: Page shows processing/loading state while whisper.cpp runs

## v2 Requirements

### Enhanced Input

- **EINP-01**: User can record audio directly in the browser
- **EINP-02**: User can drag-and-drop audio files

### Enhanced Output

- **EOUT-01**: User can copy transcription to clipboard
- **EOUT-02**: User can download transcription as .txt/.srt

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multiple model selection | Fixed tiny/base for testing |
| User authentication | Local test only |
| Transcription history/persistence | Test tool, no need to save |
| Real-time streaming transcription | Complexity beyond test scope |
| Production deployment | Local development only |
| Multiple language selection | Default language detection sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UPLD-01 | Phase 1 | ✓ Complete |
| UPLD-02 | Phase 1 | ✓ Complete |
| TRNS-01 | Phase 2 | Pending |
| TRNS-02 | Phase 2 | Pending |
| TRNS-03 | Phase 2 | Pending |
| DISP-01 | Phase 2 | Pending |
| DISP-02 | Phase 1 | ✓ Complete |

**Coverage:**
- v1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓

---

*Requirements defined: 2026-02-14*
*Last updated: 2026-02-14 after roadmap creation*
