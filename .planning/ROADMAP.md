# ROADMAP: Whisper Test

- **v1.0**: [Proof of Concept complete (2026-02-14)](milestones/v1.0-ROADMAP.md)

---

## Milestone 2.0: Enhanced Input & Output

**Goal:** Improve how users provide audio and how they consume results.

**Phases:** 3 | **Depth:** quick | **Coverage:** 100% v2 requirements mapped

---

## Phase 3: Drag-and-Drop Integration

**Goal:** Allow users to drag audio files directly into the UI for faster selection.

**Plans:** 1 plan

Plans:
- [ ] 03-01-PLAN.md — Integrate `react-dropzone` and implement overlay styling.

**Requirements:**
- EINP-01: Drag-and-drop support with visual feedback.

**Success Criteria:**
1. User can drag a file over the upload area and see a visual state change.
2. Dropping a valid audio file selects it exactly like the file picker.
3. Invalid files are rejected with a clear error message.

---

## Phase 4: Browser Recording & Visualization

**Goal:** Users can record audio directly in the browser with real-time feedback.

**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md — Native `MediaRecorder` hook and recording logic.
- [ ] 04-02-PLAN.md — Canvas visualizer and recording timer UI.

**Requirements:**
- EINP-02: Native browser recording.
- EINP-03: Real-time visual feedback (waveform + timer).

**Success Criteria:**
1. User can start/stop recording via UI.
2. Waveform animates in real-time while recording.
3. Timer shows elapsed time accurately.
4. Stop action triggers the existing upload/transcription flow.

---

## Phase 5: Output Utilities & UI Polish

**Goal:** Enable users to export results and improve overall look and feel.

**Plans:** 1 plan

Plans:
- [ ] 05-01-PLAN.md — Implementation of Export (SRT/TXT), Copy-to-clipboard, and UI refinements.

**Requirements:**
- EOUT-01: Copy to clipboard.
- EOUT-02: Export to TXT/SRT.
- UIUX-01: Enhanced status feedback.
- UIUX-02: Segment interaction polish.

**Success Criteria:**
1. "Copy" button places full text in clipboard.
2. Download buttons generate correct TXT and SRT files.
3. UI clearly displays the current step (Uploading vs Transcribing).
4. Transcription segments have improved typography and hover states.

---

## Progress

| Phase | Status | Requirements | Criteria |
|-------|--------|--------------|----------|
| 3 | Pending | 1 | 3 |
| 4 | Pending | 2 | 4 |
| 5 | Pending | 4 | 4 |

**Coverage:** 7/7 v2 requirements mapped ✓

---
*Roadmap updated: 2026-02-14*
