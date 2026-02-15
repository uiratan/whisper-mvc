# Research Summary: Whisper Test Enhancements

**Domain:** Audio recording, Drag-and-drop, and Subtitle Export.
**Researched:** 2025-02-14
**Overall confidence:** HIGH

## Executive Summary

The research confirms that implementing in-browser recording with real-time visualization and drag-and-drop support is highly feasible using native browser APIs and lightweight libraries. The **MediaRecorder API** is the standard for recording, while the **Web Audio API**'s `AnalyserNode` provides the necessary data for a **Canvas-based** waveform visualizer. Canvas is preferred over SVG for performance reasons, as it handles high-frequency updates without DOM overhead.

For drag-and-drop, **`react-dropzone`** is the recommended choice as it integrates seamlessly with React and Tailwind CSS, handling the complexities of drag states and file validation. Subtitle export (SRT/TXT) can be performed entirely client-side by generating a formatted string and using a `Blob` for download.

## Key Findings

**Stack:** Native MediaRecorder + Web Audio API (Canvas) for recording; `react-dropzone` for file inputs.
**Architecture:** Custom React hooks for recording logic; direct Canvas rendering for performance.
**Critical pitfall:** Browser-specific audio codecs and AudioContext suspension policies.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase: Enhanced Input (Drag-and-Drop)** - Low risk, high UX win.
   - Addresses: `react-dropzone` integration and Tailwind styling.
   - Avoids: Brittle native drag-and-drop implementations.

2. **Phase: Native Recording & Visualization** - Medium complexity.
   - Addresses: MediaRecorder API, AnalyserNode, and Canvas rendering.
   - Avoids: High-CPU React re-renders for waveform data.

3. **Phase: Export Functionality** - Low complexity.
   - Addresses: SRT/TXT generation and browser download triggers.

**Phase ordering rationale:**
- Drag-and-drop is a quick win that improves the existing file upload flow.
- Recording is the core new feature and requires more thorough testing (permissions, codecs).
- Export relies on having successful transcriptions, so it naturally follows.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Well-documented native APIs and stable libraries. |
| Features | HIGH | Standard patterns in modern web apps. |
| Architecture | HIGH | Proven patterns for audio in React. |
| Pitfalls | MEDIUM | Browser codec variability requires cross-browser testing. |

## Gaps to Address

- **Cross-browser Codec testing**: Specifically verifying that the backend `ffmpeg` handles the default `MediaRecorder` output from Safari (likely MP4/AAC) vs Chrome (WebM/Opus).
- **Mobile Support**: Testing touch-based file uploads and microphone permissions on mobile browsers.
