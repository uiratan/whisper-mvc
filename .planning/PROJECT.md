# Whisper Test

## What This Is

A local audio transcription web application using Next.js and whisper.cpp. Supports multiple input methods (file upload, drag-and-drop, browser recording with waveform visualization), flexible output (interactive playback, clipboard copy, TXT/SRT export), and automated deployment via GitHub Actions to Fly.io.

## Core Value

Aplicação de transcrição de áudio com múltiplos métodos de entrada e saída flexível — totalmente local, sem envio de dados para serviços externos.

## Current State (v2.1)

- **Input:** File picker, drag-and-drop, native browser recording with real-time waveform visualization
- **Processing:** Audio format conversion (FFmpeg) and local transcription (whisper.cpp) with real-time progress streaming
- **Output:** Interactive playback with bidirectional sync, copy to clipboard (plain + timestamped), export to TXT/SRT
- **CI/CD:** GitHub Actions pipeline — tag-triggered deployment to Fly.io with dual health verification
- **Docs:** Comprehensive README (242 lines) with screenshots, setup guide, deployment docs, privacy section
- **UX:** Real-time progress feedback, enhanced typography, responsive design

Deployed on Fly.io. ~1,903 LOC TypeScript/CSS. 7 phases, 11 plans shipped across 3 milestones.

## Requirements

### Validated

- ✓ Audio upload, transcription, and display — v1.0
- ✓ Drag-and-drop, browser recording, export, interactive playback — v2.0
- ✓ CI/CD pipeline (GitHub Actions → Fly.io deploy on tag) — v2.1
- ✓ Comprehensive README with screenshots — v2.1

### Active

(No active requirements — all milestones complete)

### Out of Scope

- Test automation in pipeline — não há testes significativos ainda
- Multi-environment deploy (staging/prod) — app simples, um ambiente é suficiente
- WCAG accessibility — deferred to future milestone
- Mobile UI/UX enhancements — deferred to future milestone
- Real-time transcription — deferred to future milestone

## Context

Shipped v2.1 with ~1,903 LOC TypeScript/CSS.
Tech stack: Next.js 16, whisper.cpp, FFmpeg, Fly.io, GitHub Actions.
3 milestones completed (v1.0 → v2.0 → v2.1) over 2 days.

Open items for future work:
- WCAG accessibility compliance
- Mobile responsiveness enhancements
- Audio player styling customization
- Test automation in pipeline

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js full-stack | API routes simplify backend | ✓ Good |
| whisper.cpp via CLI | Simple and direct | ✓ Good |
| Tiny/base model | Prioritize speed | ✓ Good |
| SSE progress streaming | Real-time feedback without WebSocket complexity | ✓ Good |
| Tag-based deployment | User prefers controlled releases over push-to-deploy | ✓ Good |
| --remote-only Fly.io builds | Faster, no GitHub Actions minutes consumed | ✓ Good |
| JPEG screenshots | User-captured files, practical choice | ✓ Good |
| Privacy section in README | Critical for local AI positioning | ✓ Good |

## Constraints

- **Stack**: Next.js (frontend + backend via API routes)
- **Transcription**: whisper.cpp binary local, not external API
- **Model**: tiny or base — prioritize speed over quality
- **Deploy**: Fly.io via GitHub Actions on tag creation

---
*Last updated: 2026-02-15 after v2.1 milestone*
