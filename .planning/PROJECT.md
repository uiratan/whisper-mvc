# Whisper Test

## What This Is

Uma página web simples usando Next.js que permite fazer upload de arquivos de áudio e transcreve usando whisper.cpp localmente. É um teste de funcionamento — proof of concept para validar a integração entre frontend web e whisper.cpp.

## Core Value

Upload de um arquivo de áudio e ver a transcrição com timestamps funcionando na tela.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Upload de arquivo de áudio via browser
- [ ] Backend chama whisper.cpp (binário já compilado) para transcrever
- [ ] Exibir transcrição com timestamps na página
- [ ] Usar modelo tiny/base do Whisper

### Out of Scope

- Gravação de áudio ao vivo no browser — não necessário para teste
- Múltiplos modelos / seleção de modelo — fixo em tiny/base
- Autenticação / multi-usuário — é um teste local
- Deploy em produção — roda local apenas
- Persistência de transcrições — não precisa salvar

## Context

- whisper.cpp já está compilado na máquina do usuário
  - **Binário**: `/home/uira/git/ai/whisper.cpp/build/bin/whisper-cli` (ou `main`)
  - **Modelo**: `/home/uira/git/ai/whisper.cpp/models/ggml-base.en.bin`
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
| Next.js como framework full-stack | API routes simplificam backend, sem necessidade de servidor separado | — Pending |
| whisper.cpp via CLI (spawn process) | Binário já compilado, mais simples que binding nativo | — Pending |
| Modelo tiny/base | Teste de funcionamento, velocidade > qualidade | — Pending |

---
*Last updated: 2026-02-14 after initialization*
