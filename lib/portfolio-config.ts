export interface Project {
  slug: string // Nom du dossier Supabase
  title: string // Nom affiché
  category: Category
  year?: number
  cover?: string // Nom du fichier image pour la cover (optionnel, sinon première image)
}

export interface Album {
  slug: string // Nom du dossier Supabase
  title: string // Nom affiché
  date?: string // Date événement (optionnel)
}

export type Category =
  | 'scene'
  | 'soirees'
  // | 'nature'
  | 'streets'
  | 'portraits'

export const photographer = {
  name: 'Louis Dedieu',
  title: 'Photographe',
  instagram: 'https://www.instagram.com/louis_ddg', // À personnaliser
}

export const categories: Category[] = [
  'scene',
  'soirees',
  'portraits',
  // 'nature',
  'streets',
]

export const categoryLabels: Record<Category, string> = {
  scene: 'Scène',
  soirees: 'Soirées',
  portraits: 'Portraits',
  // nature: 'Nature',
  streets: 'Streets',
}

export const projects: Project[] = [
  // SOIREES
  { slug: 'challenge-soiree', title: 'Challenge Valence 2026', category: 'soirees', cover: 'DSCF6742.JPG' },
  { slug: 'soirees-koy-comptoir', title: 'Koy Club au Comptoir Général', category: 'soirees', cover: 'DSCF3657.jpg' },
  // SCENE
  { slug: 'challenge-concert', title: 'Concert Since Metal', category: 'scene', cover: 'DSCF5843.jpg' },
  { slug: 'challenge-danse', title: 'Danse Challenge Valence', category: 'scene', cover: 'DSCF6410.jpg' },
  { slug: 'challenge-dj', title: 'Krykor Live', category: 'scene', cover: 'DSCF6020.jpg' },
  // PORTRAITS
  { slug: 'shooting-romans', title: 'B&W Shooting', category: 'portraits', cover: 'DSCF2490.jpg' },
  // STREETS
  { slug: 'antibes', title: 'Antibes', category: 'streets', cover: 'DSCF0740.jpg' },
  { slug: 'espagne', title: 'Espagne', category: 'streets' },
]

export const albums: Album[] = [
  // Albums publics - photos d'événements téléchargeables par le public
  // Exemple:
  // { slug: 'soiree-2024-03-15', title: 'Soirée du 15 mars', date: '2024-03-15' },
  { slug: 'album-koy-2026-05-07', title: 'Soirée du 7 mai (Koy Club Reggaeton)', date: '2026-05-07' },
]
