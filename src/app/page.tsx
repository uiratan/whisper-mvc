import AudioUploader from '../components/AudioUploader'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-start md:justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 sm:mb-8 text-gray-800 pt-2 sm:pt-0">
          Fëanor
        </h1>
        <AudioUploader />
      </div>
    </main>
  )
}
