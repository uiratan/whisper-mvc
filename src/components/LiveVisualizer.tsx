'use client'

import { useEffect, useRef } from 'react'

interface LiveVisualizerProps {
  stream: MediaStream
}

export default function LiveVisualizer({ stream }: LiveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(null)
  const audioContextRef = useRef<AudioContext>(null)
  const analyserRef = useRef<AnalyserNode>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return

    // Initialize Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    
    source.connect(analyser)
    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    audioContextRef.current = audioContext
    analyserRef.current = analyser

    const draw = () => {
      const width = canvas.width
      const height = canvas.height

      animationFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      // Clear canvas
      canvasCtx.fillStyle = 'rgb(249, 250, 251)' // bg-gray-50
      canvasCtx.fillRect(0, 0, width, height)

      const barWidth = (width / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height

        // Gradient color
        const gradient = canvasCtx.createLinearGradient(0, height, 0, 0)
        gradient.addColorStop(0, '#6366f1') // indigo-500
        gradient.addColorStop(1, '#818cf8') // indigo-400

        canvasCtx.fillStyle = gradient
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [stream])

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-24 rounded-md bg-gray-50 border border-gray-100"
      width={600}
      height={100}
    />
  )
}
