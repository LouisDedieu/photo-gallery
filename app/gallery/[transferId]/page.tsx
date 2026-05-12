import { notFound } from 'next/navigation'
import { Gallery } from '@/components/Gallery'
import { getGalleryBySlug } from '@/lib/gallery'
import { Metadata } from 'next'

interface PageProps {
  params: Promise<{ transferId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { transferId } = await params

  return {
    title: `Galerie Photo - ${transferId.slice(0, 8)}`,
    description: 'Visualisez et téléchargez vos photos',
  }
}

export default async function GalleryPage({ params }: PageProps) {
  const { transferId } = await params

  try {
    const metadata = await getGalleryBySlug(transferId)

    return <Gallery metadata={metadata} />
  } catch (error) {
    console.error('Failed to load gallery:', error)
    notFound()
  }
}
