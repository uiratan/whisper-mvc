# Technology Stack

**Project:** Whisper Test
**Researched:** 2025-02-14

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x | Application Framework | Current project base, supports SSR and API routes. |
| React | 19.x | UI Library | Component-based UI management. |

### Audio Processing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| MediaRecorder API | Native | Audio Recording | Browser-native, no extra weight, broad support. |
| Web Audio API | Native | Signal Analysis | Provides `AnalyserNode` for real-time waveform data. |
| Canvas API | Native | Visualization | High-performance rendering for 60fps waveform updates. |

### Drag-and-Drop
| Library | Version | Purpose | Why |
|---------|---------|---------|-------------|
| `react-dropzone` | 14.x | File Upload | Simplified handling of file drops, validation, and styling. |

### Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 3.4+ | UI Styling | Rapid styling, utility-first, already in project. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Visualization | Canvas | SVG | SVG creates many DOM nodes for complex waveforms, causing performance issues at high sample rates. |
| Audio Recording | MediaRecorder | `recordrtc` | `recordrtc` is powerful but often overkill for simple PCM/Opus recording in modern browsers. |
| Drag-and-Drop | `react-dropzone` | Native Events | Native events are brittle, harder to style with "dragging" states, and require manual cleanup of multiple listeners. |

## Installation

```bash
# Core (already present)
# npm install next react react-dom

# Supporting Libraries
npm install react-dropzone
```

## Sources

- [MDN: MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React Dropzone Documentation](https://react-dropzone.js.org/)
- [High Performance Canvas](https://www.html5rocks.com/en/tutorials/canvas/performance/)
