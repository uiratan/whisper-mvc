# 🎙️ Whisper MVC

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

> A simple and powerful audio transcription web application. Upload your audio files and get transcriptions with accurate timestamps using **whisper.cpp** running locally.

---

## ✨ Features

- **Local AI Transcription**: Powered by [whisper.cpp](https://github.com/ggerganov/whisper.cpp), no external APIs required.
- **Fast & Lightweight**: Built with Next.js 15 and the "tiny/base" Whisper model for rapid results.
- **Timestamped Results**: View exactly when each segment was spoken.
- **Privacy First**: Automatic cleanup of all uploaded and temporary files after processing.
- **Modern UI**: Clean, responsive interface built with Tailwind CSS 4.
- **Docker Ready**: Self-contained environment with all dependencies (FFmpeg, whisper-cli) pre-configured.

---

## 🚀 Quick Start (Docker)

The fastest way to get started is using Docker. This ensures all dependencies like FFmpeg and the Whisper binary are correctly configured.

### 1. Build the image
```bash
docker build -t whisper-mvc .
```

### 2. Run the container
```bash
docker run --rm -p 3000:3000 whisper-mvc
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Local Development

If you prefer to run it without Docker, you'll need to set up the environment manually.

### Prerequisites
- Node.js 22+
- **FFmpeg** installed and available in your PATH.
- **whisper.cpp** compiled binary (`whisper-cli`).

### Setup
1. **Clone the repo:**
   ```bash
   git clone https://github.com/uiratan/whisper-mvc.git
   cd whisper-mvc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env.local` file:
   ```env
   WHISPER_CPP_PATH="/path/to/your/whisper-cli"
   WHISPER_MODEL_PATH="/path/to/your/ggml-base.bin"
   ```

4. **Run Dev Server:**
   ```bash
   npm run dev
   ```

---

## 🏗️ Architecture

- **Frontend**: Next.js App Router with React 19.
- **API**: Route Handlers managing file uploads and process spawning.
- **Processing Pipeline**:
  1. Receive Audio (MPEG/WAV/OGG).
  2. Convert to **WAV 16kHz Mono** (PCM s16le) via `fluent-ffmpeg`.
  3. Execute `whisper-cli` with the converted file.
  4. Parse JSON output and return to the client.
  5. **Auto-Cleanup**: All files are deleted via `finally` blocks to ensure no data persists on the server.

---

## 🐳 Deployment

This project is optimized for deployment on platforms like **Fly.io** or **Railway** using the provided `Dockerfile`.

**Memory Note**: The Whisper "base" model requires approximately 512MB-1GB of RAM for smooth execution. Ensure your deployment target has sufficient resources.

---

## 📄 License

This project is licensed under the ISC License.

---

Built with ❤️ by [Uiratan Cavalcante](https://github.com/uiratan)
