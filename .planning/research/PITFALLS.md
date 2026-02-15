# Domain Pitfalls

**Domain:** Browser Audio & File Handling
**Researched:** 2025-02-14

## Critical Pitfalls

### Pitfall 1: Browser Autoplay/AudioContext Block
**What goes wrong:** `AudioContext` is suspended by default until a user gesture (click) occurs.
**Why it happens:** Browser privacy/annoyance policies.
**Consequences:** Visualizer won't start or recording fails silently.
**Prevention:** Resume `AudioContext` inside the `onClick` handler of the "Start Recording" button.

### Pitfall 2: MediaRecorder Codec Inconsistency
**What goes wrong:** Recording in Chrome (`audio/webm`) vs Safari (`audio/mp4` or `audio/wav`).
**Why it happens:** Different browser engines support different containers/codecs.
**Consequences:** Server-side `ffmpeg` might fail if it doesn't support the incoming format.
**Prevention:** Check `MediaRecorder.isTypeSupported` or use a standard format like `audio/webm;codecs=opus`. Ensure backend `ffmpeg` is versatile.

## Moderate Pitfalls

### Pitfall 1: Memory Leaks with Object URLs
**What goes wrong:** Creating many `URL.createObjectURL(blob)` without revoking them.
**Prevention:** Always call `URL.revokeObjectURL(url)` after the download is triggered or when the component unmounts.

### Pitfall 2: Timer Drift
**What goes wrong:** `setInterval(..., 1000)` is not guaranteed to be exact.
**Prevention:** For a simple UI timer, it's usually fine. For high precision, compare `Date.now()` with a start timestamp.

## Minor Pitfalls

### Pitfall 1: Drag-and-Drop Overlay "Flicker"
**What goes wrong:** Overlay disappears when hovering over children of the dropzone.
**Prevention:** Use `pointer-events-none` on the overlay children or handle `dragEnter`/`dragLeave` carefully with a counter. `react-dropzone` handles this well automatically.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Recording | Permission Denied | Graceful UI error state if user blocks microphone. |
| Export | Large files | Use `Blob` efficiently; SRT is text so it's usually small. |
| Waveform | Tab Backgrounding | `requestAnimationFrame` stops in background; `MediaRecorder` continues. UI may lag behind. |

## Sources

- [MDN: Autoplay guide for media and Web Audio API](https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide)
- [StackOverflow: MediaRecorder supported types](https://stackoverflow.com/questions/41739837/all-mime-types-supported-by-mediarecorder-in-firefox-and-chrome)
