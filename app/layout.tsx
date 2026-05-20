import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Louis Dedieu - Photographe',
  description: 'Portfolio photo - Concerts, Soirées, Nature, Streets, Portraits',
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
