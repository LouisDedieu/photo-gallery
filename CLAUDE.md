# Photo Gallery & Portfolio

Application portfolio photographe + galeries clients avec interface style macOS/Apple.

## Stack technique

- **Framework**: Next.js 15 (App Router)
- **React**: 19
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (Storage + PostgreSQL)
- **UI**: Design Apple-like avec sidebar redimensionnable, dark mode, masonry grid

## Structure du projet

```
app/
├── page.tsx                      # Page d'accueil (portfolio)
├── layout.tsx                    # Layout principal
├── globals.css                   # Styles globaux + portfolio
├── gallery/[transferId]/         # Page galerie dynamique
│   ├── page.tsx
│   ├── loading.tsx
│   └── not-found.tsx
├── api/
│   ├── selection/route.ts        # API sélection photos
│   └── transfer/route.ts         # API transfert

components/
├── AppShell.tsx                  # Shell global (sidebar + contenu)
├── Sidebar.tsx                   # Sidebar partagée (navigation, catégories, dark mode)
├── PortfolioContent.tsx          # Contenu page d'accueil (grille projets)
├── ProjectCard.tsx               # Carte projet avec image cover + titre overlay
├── Gallery.tsx                   # Composant galerie photos
├── PhotoCard.tsx                 # Carte photo individuelle
├── Lightbox.tsx                  # Visionneuse plein écran
├── SelectionBar.tsx              # Barre de sélection/téléchargement
└── ExpirationBanner.tsx          # Bannière expiration

lib/
├── portfolio-config.ts           # Config portfolio (photographe, catégories, projets, albums)
├── gallery.ts                    # Logique galerie + covers projets
├── selections.ts                 # Gestion des sélections
├── supabase.ts                   # Client Supabase + helpers
└── types.ts                      # Types TypeScript
```

## Concepts clés

### Types de galeries

| Type | But | Config | Sidebar | Sélection |
|------|-----|--------|---------|-----------|
| **Portfolio** | Montrer son travail | `projects[]` | Catégorie surlignée | ❌ |
| **Album public** | Événements publics | `albums[]` | Section "Albums" permanente | ✅ |
| **Galerie client** | Livrer photos à un client | Aucune | Section "Galerie" temporaire | ✅ |

### Configuration (`lib/portfolio-config.ts`)

```typescript
export const photographer = {
  name: 'Louis Dedieu',
  title: 'Photographe',
  instagram: 'https://www.instagram.com/louis_ddg',
}

export type Category = 'scene' | 'soirees' | 'streets' | 'portraits'

export const projects: Project[] = [
  { slug: 'nom-dossier-supabase', title: 'Titre Affiché', category: 'scene', year: 2024, cover: 'photo-05.jpg' },
]

export const albums: Album[] = [
  { slug: 'soiree-2024-03-15', title: 'Soirée du 15 mars', date: '2024-03-15' },
]
```

- `slug` = nom exact du dossier dans Supabase
- `cover` = nom du fichier image à utiliser (optionnel, sinon première image par ordre alphabétique)

### Ajouter un projet portfolio

1. Upload photos dans un dossier Supabase (`gallery-photos/mon-projet/`)
2. Ajouter dans `portfolio-config.ts`:
   ```typescript
   { slug: 'mon-projet', title: 'Mon Projet', category: 'scene', cover: 'DSC_0001.jpg' }
   ```

### Ajouter un album public

1. Upload photos dans un dossier Supabase (`gallery-photos/mon-album/`)
2. Ajouter dans `portfolio-config.ts`:
   ```typescript
   { slug: 'mon-album', title: 'Mon Album', date: '2024-03-15' }
   ```
3. L'album apparaît dans la sidebar sur toutes les pages avec sélection/téléchargement activés

### Galerie client

1. Upload photos dans un dossier Supabase
2. Partager le lien `/gallery/nom-du-dossier`
3. Pas besoin de config, fonctionne automatiquement

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## Commandes

```bash
npm run dev      # Développement
npm run build    # Build production
npm run start    # Serveur production
npm run lint     # Linter
```

## Base de données (Supabase)

Table `selections`:
- `id`: UUID
- `gallery_id`: TEXT (nom du dossier)
- `session_id`: TEXT (identifiant navigateur)
- `photo_ids`: TEXT[] (UUIDs sélectionnés)
- `updated_at`: TIMESTAMPTZ

## Fonctionnalités

- **Portfolio**: Grille de projets par catégorie avec images cover
- **Albums publics**: Photos d'événements téléchargeables par le public
- **Galeries clients**: Livraison photos avec sélection/téléchargement
- **Galeries**: Affichage masonry avec ratio original ou grilles carrées
- **Sélection**: Multiple avec persistance (albums + galeries clients)
- **Lightbox**: Navigation clavier, téléchargement individuel
- **Téléchargement ZIP**: Photos sélectionnées
- **Dark mode**: Persisté localStorage
- **Sidebar**: Redimensionnable, navigation par catégorie
- **Responsive**: Mobile-friendly
