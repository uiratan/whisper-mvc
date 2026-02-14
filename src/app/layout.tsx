import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audio Transcription Test",
  description: "Upload audio files and view transcriptions with timestamps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
