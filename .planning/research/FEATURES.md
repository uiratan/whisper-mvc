# Feature Landscape

**Domain:** Audio Transcription Web App
**Researched:** 2025-02-14

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| In-Browser Recording | Quick capture without external files. | Medium | Requires microphone permission handling. |
| Drag-and-Drop | Industry standard for file uploads. | Low | Easy with `react-dropzone`. |
| Recording Timer | User needs to know duration of capture. | Low | Sync with recording state. |
| Basic TXT Export | Simple way to get results out. | Low | Simple string blob. |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Real-time Waveform | Visual feedback confirms audio is being picked up. | Medium | Uses AnalyserNode + Canvas. |
| SRT Export | Professional format for video subtitles. | Low | Requires specific timestamp formatting. |
| Auto-Transcription | Start transcription immediately after recording stop. | Medium | Glue between recording and existing API. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Client-side Transcription | Whisper models are too large for browser RAM/WASM usually. | Use server-side `whisper.cpp` (current path). |
| Complex Audio Editing | Out of scope for a transcription tool. | Provide simple "trim" if necessary, or none. |

## Feature Dependencies

```
Microphone Access → Audio Recording → Auto-Transcription
File Drop → File Upload → Transcription
Transcription Results → SRT/TXT Export
```

## MVP Recommendation

Prioritize:
1. **Drag-and-Drop Overlay**: Easiest UX win.
2. **Native Recording**: Core requirement for next phase.
3. **Waveform Visualizer**: High-value visual feedback.
4. **SRT Export**: High utility for transcription workflows.

Defer: Recording history/persistence (keep it in memory for now).

## Sources

- [Project Requirements (v1.0 Milestone)](../v1.0-REQUIREMENTS.md)
- [Competitor Analysis (Standard UX patterns)](https://www.rev.com/, https://otter.ai/)
