# Whisper Test

## Current State (v1.0)
Proof of Concept complete. The application successfully uploads audio files, converts them to the required format, transcribes them using local `whisper.cpp`, and displays results with formatted timestamps.

## Next Milestone Goals
- **Enhanced Input**: In-browser recording and drag-and-drop support.
- **Enhanced Output**: Export to SRT/TXT and copy to clipboard.
- **UI/UX Polishing**: Improved feedback and segment interaction.

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
*Last updated: 2026-02-14 | v1.0 Shipped*
