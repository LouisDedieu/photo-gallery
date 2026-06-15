# Photo Gallery & Portfolio

Application portfolio photographe + galeries clients avec interface style macOS/Apple.

## Stack technique

- **Framework**: Next.js 15 (App Router)
- **React**: 19
- **Styling**: Tailwind CSS 4
- **Storage**: Cloudflare R2 (S3-compatible, 10GB gratuit)
- **Database**: Cloudflare D1 (SQLite edge)
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
├── PhotoCard.tsx                 # Carte photo individuelle (Next.js Image)
├── Lightbox.tsx                  # Visionneuse plein écran
├── SelectionBar.tsx              # Barre de sélection/téléchargement
└── ExpirationBanner.tsx          # Bannière expiration

lib/
├── cloudflare/
│   ├── r2.ts                     # Client R2 (AWS SDK S3-compatible)
│   └── d1.ts                     # Client D1 (REST API)
├── portfolio-config.ts           # Config portfolio (photographe, catégories, projets, albums)
├── gallery.ts                    # Logique galerie + covers projets
├── selections.ts                 # Gestion des sélections
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
  { slug: 'nom-dossier-r2', title: 'Titre Affiché', category: 'scene', year: 2024, cover: 'photo-05.jpg' },
]

export const albums: Album[] = [
  { slug: 'soiree-2024-03-15', title: 'Soirée du 15 mars', date: '2024-03-15' },
]
```

- `slug` = nom exact du dossier dans R2
- `cover` = nom du fichier image à utiliser (optionnel, sinon première image par ordre alphabétique)

### Ajouter un projet portfolio

1. Upload photos dans un dossier R2 (`gallery-photos/mon-projet/`)
2. Ajouter dans `portfolio-config.ts`:
   ```typescript
   { slug: 'mon-projet', title: 'Mon Projet', category: 'scene', cover: 'DSC_0001.jpg' }
   ```

### Ajouter un album public

1. Upload photos dans un dossier R2 (`gallery-photos/mon-album/`)
2. Ajouter dans `portfolio-config.ts`:
   ```typescript
   { slug: 'mon-album', title: 'Mon Album', date: '2024-03-15' }
   ```
3. L'album apparaît dans la sidebar sur toutes les pages avec sélection/téléchargement activés

### Galerie client

1. Upload photos dans un dossier R2
2. Partager le lien `/gallery/nom-du-dossier`
3. Pas besoin de config, fonctionne automatiquement

## Variables d'environnement

```env
# Cloudflare R2 (Storage)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=gallery-photos
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Cloudflare D1 (Database)
CF_ACCOUNT_ID=xxx
CF_API_TOKEN=xxx
CF_D1_DATABASE_ID=xxx

# PostHog Analytics (optionnel)
NEXT_PUBLIC_POSTHOG_KEY=xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Commandes

```bash
npm run dev      # Développement
npm run build    # Build production
npm run start    # Serveur production
npm run lint     # Linter
```

## Base de données (Cloudflare D1)

Table `selections`:
- `id`: TEXT PRIMARY KEY
- `gallery_id`: TEXT NOT NULL
- `session_id`: TEXT NOT NULL
- `photo_ids`: TEXT NOT NULL (JSON array)
- `updated_at`: TEXT NOT NULL

Index: `idx_selections_lookup` sur `(gallery_id, session_id)`

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
- **Optimisation images**: Next.js Image avec resize automatique
