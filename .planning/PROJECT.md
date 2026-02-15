# Whisper Test

## Current State (v2.0)

The application provides a complete audio transcription workflow with multiple input methods and flexible output options:

- **Input:** File picker, drag-and-drop, and native browser recording (with real-time waveform visualization)
- **Processing:** Audio format conversion and local transcription using `whisper.cpp`
- **Output:** Transcription display with interactive playback, copy to clipboard (plain + timestamped), and export to TXT/SRT formats
- **UX:** Real-time progress feedback, enhanced typography, and bidirectional audio/text synchronization

All v2.0 requirements satisfied. Deployed on Fly.io.

## Current Milestone: v2.1 CI/CD & Docs

**Goal:** Automate deployment via GitHub Actions and bring documentation up to date.

**Target features:**
- GitHub Actions pipeline with automatic deploy to Fly.io on tag creation
- README updated to reflect current system capabilities

## Requirements

### Validated

- ✓ Audio upload, transcription, and display — v1.0
- ✓ Drag-and-drop, browser recording, export, interactive playback — v2.0

### Active

- [ ] CI/CD pipeline (GitHub Actions → Fly.io deploy on tag)
- [ ] README reflecting current system state

### Out of Scope

- Test automation in pipeline — not needed for this milestone
- WCAG accessibility — deferred to future milestone
- Mobile UI/UX — deferred to future milestone
- Real-time transcription — deferred to future milestone

---

<details>
<summary>v1.0 Discovery & Initialization Details</summary>

## What This Is
Uma página web simples usando Next.js que permite fazer upload de arquivos de áudio e transcreve usando whisper.cpp localmente. É um teste de funcionamento — proof of concept para validar a integração entre frontend web e whisper.cpp.

## Core Value
Upload de um arquivo de áudio e ver a transcrição com timestamps funcionando na tela.

## Context
- whisper.cpp já está compilado na máquina do usuário
- Projeto é um teste de funcionamento, não um produto
- Next.js escolhido como framework (frontend + API routes)
- Modelo base.en para velocidade no teste

## Constraints
- **Stack**: Next.js (frontend + backend via API routes)
- **Transcrição**: whisper.cpp binário local, não API externa
- **Modelo**: tiny ou base — priorizar velocidade sobre qualidade
- **Escopo**: Mínimo viável — só precisa funcionar

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js como framework full-stack | API routes simplificam backend | ✓ Complete |
| whisper.cpp via CLI (spawn process) | Simples e direto | ✓ Complete |
| Modelo tiny/base | Priorizar velocidade | ✓ Complete |

</details>

---
*Last updated: 2026-02-15 after v2.1 milestone start*
