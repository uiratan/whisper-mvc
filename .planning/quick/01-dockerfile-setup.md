# Quick Task: Dockerfile for Railway/Fly.io Deployment

## Objective
Create a Dockerfile that bundles the Next.js application with FFmpeg and whisper.cpp for deployment on platforms like Railway or Fly.io.

## Tasks
- [x] Create `Dockerfile` with multi-stage build (build-time for whisper.cpp and Next.js, runtime for execution)
- [x] Create `.dockerignore` to exclude node_modules and other unnecessary files
- [x] Update `STATE.md` to reflect the completed quick task
- [x] Commit changes

## Verification
- [x] Verify `Dockerfile` contains necessary commands to install FFmpeg
- [x] Verify `Dockerfile` contains commands to clone and build whisper.cpp
- [x] Verify `Dockerfile` sets `WHISPER_CPP_PATH` and `WHISPER_MODEL_PATH`
