'use client'

import posthog from 'posthog-js'

// Session ID management
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = localStorage.getItem('gallery_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('gallery_session_id', sessionId)
  }
  return sessionId
}

// Gallery context for grouping visitors
export function setGalleryContext(
  galleryId: string,
  galleryName: string,
  galleryType: 'portfolio' | 'album' | 'client',
  photoCount: number
): void {
  posthog.group('gallery', galleryId, {
    name: galleryName,
    type: galleryType,
    photo_count: photoCount,
  })
}

// Typed tracking helpers
export const track = {
  // Gallery events
  galleryViewed: (props: {
    gallery_id: string
    gallery_name: string
    gallery_type: 'portfolio' | 'album' | 'client'
    photo_count: number
  }) => {
    posthog.capture('gallery_viewed', props)
  },

  lightboxOpened: (props: {
    gallery_id: string
    photo_index: number
    photo_uuid: string
  }) => {
    posthog.capture('lightbox_opened', props)
  },

  lightboxClosed: (props: {
    gallery_id: string
    photos_viewed: number
    time_spent_seconds: number
  }) => {
    posthog.capture('lightbox_closed', props)
  },

  lightboxNavigated: (props: {
    gallery_id: string
    direction: 'prev' | 'next'
    photo_index: number
  }) => {
    posthog.capture('lightbox_navigated', props)
  },

  photoSelected: (props: {
    gallery_id: string
    photo_uuid: string
    selection_count: number
  }) => {
    posthog.capture('photo_selected', props)
  },

  photoDeselected: (props: {
    gallery_id: string
    photo_uuid: string
    selection_count: number
  }) => {
    posthog.capture('photo_deselected', props)
  },

  selectionCleared: (props: {
    gallery_id: string
    cleared_count: number
  }) => {
    posthog.capture('selection_cleared', props)
  },

  selectionAll: (props: {
    gallery_id: string
    selected_count: number
  }) => {
    posthog.capture('selection_all', props)
  },

  viewModeChanged: (props: {
    gallery_id: string
    mode: 'masonry' | 'square'
  }) => {
    posthog.capture('ui_view_mode_changed', props)
  },

  // Navigation events
  navCategoryClicked: (props: { category: string }) => {
    posthog.capture('nav_category_clicked', props)
  },

  navAlbumClicked: (props: {
    album_slug: string
    album_title: string
  }) => {
    posthog.capture('nav_album_clicked', props)
  },

  navHomeClicked: () => {
    posthog.capture('nav_home_clicked')
  },

  darkModeToggled: (props: { enabled: boolean }) => {
    posthog.capture('ui_dark_mode_toggled', props)
  },

  // Project events
  projectClicked: (props: {
    project_slug: string
    project_title: string
    category: string
  }) => {
    posthog.capture('project_clicked', props)
  },
}
