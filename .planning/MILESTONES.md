# Milestones Archive: Whisper Test

Historical record of shipped versions.

---

## v2.0: Enhanced Input & Output

**Shipped:** 2026-02-15
**Phases:** 3-5 (3 phases, 5 plans)
**Tag:** [v2.0](../../releases/tag/v2.0)

### Deliverables

- **Input Methods:** Drag-and-drop (Phase 3), Browser recording with real-time visualization (Phase 4)
- **Output Utilities:** Copy to clipboard, export to TXT/SRT with proper formatting (Phase 5)
- **UI/UX:** Enhanced typography, interactive audio playback with click-to-seek, real-time segment highlighting (Phase 5)

### Requirements

| ID | Requirement | Status |
|----|----|--------|
| EINP-01 | Drag-and-drop support | ✅ |
| EINP-02 | Browser recording | ✅ |
| EINP-03 | Real-time feedback | ✅ |
| EOUT-01 | Copy to clipboard | ✅ |
| EOUT-02 | Export TXT/SRT | ✅ |
| UIUX-01 | Status feedback | ✅ |
| UIUX-02 | Segment interaction | ✅ |

**Coverage:** 7/7 (100%)

### Scope

- Files: 40 changed, 4,492 insertions
- Commits: 35 since v1.0
- Integration: All critical paths verified (0 blockers)
- Quality: TypeScript passes, all tests pass

### Archive

- **Roadmap:** [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)
- **Requirements:** [milestones/v2.0-REQUIREMENTS.md](milestones/v2.0-REQUIREMENTS.md)
- **Audit:** [milestones/v2.0-MILESTONE-AUDIT.md](milestones/v2.0-MILESTONE-AUDIT.md)

---

## v1.0: Proof of Concept

**Shipped:** 2026-02-14
**Phases:** 1-2 (2 phases, 4 plans)
**Tag:** [v1.0](../../releases/tag/v1.0)

### Deliverables

- **Frontend:** Audio upload with progress tracking, formatted results display with timestamps
- **Backend:** Audio conversion (FFmpeg), transcription (whisper.cpp), progress streaming (SSE)

### Scope

- Files: 15 changed, ~2,500 lines
- Integration: Core proof-of-concept validated

### Archive

- **Roadmap:** [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)
- **Requirements:** [milestones/v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)

---

---

## v2.1: CI/CD & Docs

**Shipped:** 2026-02-15
**Phases:** 6-7 (2 phases, 2 plans)
**Tag:** [v2.1](../../releases/tag/v2.1)

### Deliverables

- **CI/CD:** GitHub Actions pipeline with tag-triggered deployment to Fly.io, remote Docker builds, dual health verification
- **Documentation:** Comprehensive README rewrite (242 lines) with screenshots, setup guide, deployment docs, privacy section

### Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| CICD-01 | Auto deploy on tag creation | ✅ |
| CICD-02 | Healthcheck after deploy | ✅ |
| CICD-03 | Deploy status notification | ✅ |
| DOCS-01 | Feature documentation | ✅ |
| DOCS-02 | Setup instructions | ✅ |
| DOCS-03 | Deploy documentation | ✅ |
| DOCS-04 | UI screenshots | ✅ |

**Coverage:** 7/7 (100%)

### Scope

- Files: 13 changed, 1,702 insertions
- Timeline: 1 day (2026-02-14 → 2026-02-15)
- Git range: 11a1f17..04f0031

### Archive

- **Roadmap:** [milestones/v2.1-ROADMAP.md](milestones/v2.1-ROADMAP.md)
- **Requirements:** [milestones/v2.1-REQUIREMENTS.md](milestones/v2.1-REQUIREMENTS.md)

---

*Last updated: 2026-02-15*

