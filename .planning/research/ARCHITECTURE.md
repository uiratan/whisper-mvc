# Architecture Patterns

**Domain:** Audio Transcription Web App
**Researched:** 2025-02-14

## Recommended Architecture

The recording logic should be encapsulated in a custom hook to separate UI from the browser's imperative Media APIs.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `Recorder` | Main UI for recording, shows timer and waveform. | `useMediaRecorder` hook |
| `Waveform` | Renders canvas based on frequency data. | `AnalyserNode` |
| `FileDrop` | Handles file selection and drop overlay. | `onFileUpload` callback |
| `ExportManager` | Logic for generating and downloading files. | Result State |

### Data Flow

1. **Recording:** `User` -> `Recorder` -> `useMediaRecorder` -> `MediaRecorder API` -> `Blob`.
2. **Visualization:** `MediaStream` -> `AudioContext` -> `AnalyserNode` -> `requestAnimationFrame` -> `Canvas`.
3. **Transcription:** `Blob` -> `POST /api/upload` -> `whisper.cpp` -> `JSON`.
4. **Export:** `JSON` -> `SRT Formatter` -> `Blob` -> `URL.createObjectURL` -> `User`.

## Patterns to Follow

### Pattern 1: Recording Hook
Encapsulate state (idle, recording, paused, stopped) and data handling.

```typescript
function useMediaRecorder() {
  const [status, setStatus] = useState('idle');
  const [audioBlob, setAudioBlob] = useState(null);
  
  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    // ... logic
  };
  
  return { status, start, stop, audioBlob };
}
```

### Pattern 2: Canvas Waveform
Use `requestAnimationFrame` for smooth rendering and `AnalyserNode.getByteTimeDomainData` for the waveform.

```typescript
const draw = () => {
  analyser.getByteTimeDomainData(dataArray);
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  // ... loop through dataArray and draw lines
  ctx.stroke();
  requestAnimationFrame(draw);
};
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: React State for Waveform Data
**What:** Storing frequency arrays in React state.
**Why bad:** Causes 60+ re-renders per second, killing performance.
**Instead:** Draw directly to Canvas using a `ref` and `requestAnimationFrame` outside the React render cycle.

## Scalability Considerations

| Concern | At 100 users | At 10K users |
|---------|--------------|--------------|
| Audio Storage | Local temporary storage is fine. | Need S3 or similar for persistence. |
| Transcription | Single server spawn is fine. | Need a task queue (BullMQ, Redis) + workers. |

## Sources

- [React Patterns: Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Web Audio API: Visualizations](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API)
