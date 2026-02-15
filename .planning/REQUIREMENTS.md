# Requirements: Whisper Test

**Defined:** 2026-02-15
**Core Value:** Aplicação de transcrição de áudio com múltiplos métodos de entrada e saída flexível.

## v2.1 Requirements

Requirements for CI/CD & Docs milestone. Each maps to roadmap phases.

### CI/CD

- [ ] **CICD-01**: Deploy automático no Fly.io é disparado quando uma tag é criada no GitHub
- [ ] **CICD-02**: Pipeline verifica se o app está saudável após deploy (healthcheck)
- [ ] **CICD-03**: Pipeline notifica sucesso ou falha do deploy via GitHub status

### Documentation

- [ ] **DOCS-01**: README lista todas as features atuais do app (input, processamento, output)
- [ ] **DOCS-02**: README inclui instruções de setup local (dependências, como rodar)
- [ ] **DOCS-03**: README documenta como fazer deploy e como a pipeline funciona
- [ ] **DOCS-04**: README inclui screenshots da interface atual

## Future Requirements

### Testing

- **TEST-01**: Pipeline roda testes automatizados antes do deploy
- **TEST-02**: Pipeline bloqueia deploy se testes falharem

## Out of Scope

| Feature | Reason |
|---------|--------|
| Test automation in pipeline | Não há testes significativos ainda, adicionar em milestone futuro |
| Multi-environment deploy (staging/prod) | App simples, um ambiente é suficiente |
| Deploy por push na master | Usuário prefere controle via tags |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CICD-01 | Phase 6 | Pending |
| CICD-02 | Phase 6 | Pending |
| CICD-03 | Phase 6 | Pending |
| DOCS-01 | Phase 7 | Pending |
| DOCS-02 | Phase 7 | Pending |
| DOCS-03 | Phase 7 | Pending |
| DOCS-04 | Phase 7 | Pending |

**Coverage:**
- v2.1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-15*
*Last updated: 2026-02-15 after roadmap creation*
