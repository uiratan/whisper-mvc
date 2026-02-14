import AudioUploader from '../components/AudioUploader'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Audio Transcription Test
        </h1>
        <AudioUploader />
      </div>
    </main>
  )
}
