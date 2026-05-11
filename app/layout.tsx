import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Galerie Photo',
  description: 'Visualisez et téléchargez vos photos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  )
}
