-- Supabase Schema for Photo Gallery (Storage-based)
-- Run this in Supabase SQL Editor

-- Selections (stocke les sélections par session)
-- gallery_id = nom du dossier dans le bucket gallery-photos
CREATE TABLE IF NOT EXISTS selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  photo_ids TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gallery_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_selections_gallery_session ON selections(gallery_id, session_id);

-- Note: Les tables 'galleries' et 'photos' ne sont plus nécessaires.
-- Les galeries sont définies par les dossiers dans le bucket 'gallery-photos'.
-- Exemple: un dossier 'vacances-2024' crée la galerie /gallery/vacances-2024
