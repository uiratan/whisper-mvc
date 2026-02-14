# Stage 1: Build whisper.cpp (Official CMake method)
FROM debian:bookworm-slim AS whisper-builder
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    cmake \
    pkg-config \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN git clone https://github.com/ggerganov/whisper.cpp.git
WORKDIR /app/whisper.cpp

# Force static build to create a self-contained binary
RUN cmake -B build -DBUILD_SHARED_LIBS=OFF && cmake --build build --config Release -j $(nproc)

# Download the base model
RUN ./models/download-ggml-model.sh base

# Stage 2: Build Next.js app
FROM node:22-slim AS node-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:22 AS runner
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy whisper.cpp binary and model
RUN mkdir -p /app/whisper.cpp/models
# With BUILD_SHARED_LIBS=OFF, whisper-cli will be a "fat" binary with everything included
COPY --from=whisper-builder /app/whisper.cpp/build/bin/whisper-cli /app/whisper.cpp/whisper-cli
COPY --from=whisper-builder /app/whisper.cpp/models/ggml-base.bin /app/whisper.cpp/models/ggml-base.bin
RUN chmod +x /app/whisper.cpp/whisper-cli

# Copy built Next.js app
COPY --from=node-builder /app/package*.json ./
COPY --from=node-builder /app/.next ./.next
COPY --from=node-builder /app/public ./public
COPY --from=node-builder /app/node_modules ./node_modules
COPY --from=node-builder /app/next.config.ts ./

# Set environment variables
ENV WHISPER_CPP_PATH=/app/whisper.cpp/whisper-cli
ENV WHISPER_MODEL_PATH=/app/whisper.cpp/models/ggml-base.bin
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"

# Ensure upload directory exists and is writable
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
