# Phase 4 Context: Browser Recording & Visualization

**Phase:** 04-browser-recording-visualization
**Date:** 2026-02-14
**Status:** Decisions Locked

---

## 1. Recording Lifecycle & Flow

### Stop & Processing
- **Manual Confirmation**: Stopping a recording does NOT auto-upload. It enters a "Preview & Review" state.
- **Preview Player**: Users can listen to the recording before deciding to upload.
- **Discard Option**: A clear "Discard" action is available to throw away the recording without processing.
- **Direct Redo**: A "Record Again" button is available in the preview state to immediately start a new recording, replacing the previous one.

### Input Handling
- **Conflict Strategy**: "Last Action Wins". If a user records audio, it replaces any file currently selected via drag-and-drop.
- **Duration Limits**: No artificial time limit. The recording is limited only by the existing **25MB** system file size constraint.

---

## 2. User Interface & Controls

### Preview State
- **Waveform Player**: The preview interface should utilize a waveform-based UI for seeking and visualization.
- **Full Playback Controls**: The player must include:
    - Play / Pause
    - Seeking (via waveform interaction)
    - Volume control
    - Playback speed adjustment
- **Simple Transition**: Upon stopping, the "Live Visualizer" is replaced by the "Preview Player" UI to keep the interface clean.

---

## 3. Deferred Ideas
*(Captured for future phases, not part of Phase 4)*
- Persistent recording history/gallery.
- Waveform editing (trimming).
- Cloud sync of recordings before transcription.

---
**Next Steps:**
1. `/gsd:plan-phase 4` (Downstream agents will use these decisions to generate technical tasks).
