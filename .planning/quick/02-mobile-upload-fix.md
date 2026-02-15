# Quick Task: Mobile Audio Upload Fix

**Status:** Completed
**Date:** 2026-02-14

## Problem
Users recording audio directly from mobile devices (e.g., Android Voice Recorder) were encountering an "Invalid file type" error. This was due to the app only accepting `audio/wav`, `audio/mpeg`, and `audio/ogg`, while mobile devices often use formats like `audio/m4a`, `audio/aac`, or `audio/webm`.

## Solution
Expand the allowed MIME types in both the frontend validation and the backend API to include common mobile audio formats.

## Tasks
- [x] Update `src/app/api/upload/route.ts` with expanded `ALLOWED_TYPES`
- [x] Update `src/components/AudioUploader.tsx` validation logic
- [x] Update `src/components/AudioUploader.tsx` UI text and `accept` attribute
- [x] Verify fix with user

## Files Changed
- `src/app/api/upload/route.ts`
- `src/components/AudioUploader.tsx`
- `.planning/STATE.md`
