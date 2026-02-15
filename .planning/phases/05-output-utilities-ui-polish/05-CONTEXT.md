# Phase 5 Context: Output Utilities & UI Polish

**Phase:** 05-output-utilities-ui-polish
**Date:** 2026-02-14
**Status:** Decisions Locked

---

## 1. Export & Action Controls

### Layout & Placement
- **Location**: All action buttons (Copy, Export SRT, Export TXT) must be grouped at the **Top of the Results Card** for immediate access.
- **Naming Convention**: Exported files should use the **Original Recording/File Name** as the base (e.g., `my-audio.srt`).

### Copy to Clipboard
- **Dual Modes**: Users should have options to copy:
    1. **Text Only**: Clean transcription without any metadata.
    2. **With Timestamps**: A formatted version including segment times.
- **Visual Feedback**: Successful copy is confirmed by a temporary **Icon Change** (e.g., checkmark) on the button.

### Export Formats
- **SRT**: Standard subtitle format based on the generated segments.
- **TXT**: Plain text export of the full transcription.

---

## 2. Status & Interaction Polish

### Processing Status
- **Verbosity**: Show **High-level steps only** (e.g., "Uploading...", "Transcribing...") to keep the UI clean and simple.

### Segment Interactivity
- **Bidirectional Sync**:
    - **Seeking**: Clicking on any timestamp or segment (in the list or the full text block) should jump the audio player to that exact time.
    - **Active Highlighting**: During audio playback, the UI must visually highlight the currently spoken segment in real-time.
- **Full Text Interactive**: Both the segmented list and the "Full Text" summary block should support interactive seeking.

---

## 3. Success Criteria
1. Action buttons are prominent at the top of results.
2. Users can choose between clean and timestamped copy.
3. Exported filenames match the source audio.
4. Clicking text syncs with the audio player.
5. UI reflects the current spoken words during playback.

---
**Next Steps:**
1. `/gsd:plan-phase 5` (Researching SRT generation and interaction synchronization).
