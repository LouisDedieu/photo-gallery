'use client'

import { useEffect, useRef, useState } from 'react'
import { photographer, categories, categoryLabels, type Category } from '@/lib/portfolio-config'
import type { ProjectWithCover } from '@/lib/gallery'
import { ProjectCard } from './ProjectCard'

interface PortfolioContentProps {
  projects: ProjectWithCover[]
}

export function PortfolioContent({ projects }: PortfolioContentProps) {
  const [heroAnimated, setHeroAnimated] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set())
  const [initialCardsMarked, setInitialCardsMarked] = useState(false)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map())

  const getProjectsByCategory = (category: Category) =>
    projects.filter((p) => p.category === category)

  const categoriesWithProjects = categories.filter(
    (cat) => getProjectsByCategory(cat).length > 0
  )

  // Hero animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setHeroAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Intersection Observer for sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.2, rootMargin: '-50px' }
    )

    sectionRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [categoriesWithProjects])

  // Mark initially visible cards (no animation for these)
  useEffect(() => {
    if (initialCardsMarked) return

    // Small delay to ensure refs are populated
    const timer = setTimeout(() => {
      const visible: string[] = []
      cardRefs.current.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
        const slug = el.getAttribute('data-slug')
        if (isInViewport && slug) {
          visible.push(slug)
        }
      })
      setRevealedCards(new Set(visible))
      setInitialCardsMarked(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [initialCardsMarked])

  // Intersection Observer for cards entering viewport (with animation)
  useEffect(() => {
    if (!initialCardsMarked) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slug = entry.target.getAttribute('data-slug')
            if (slug) {
              setRevealedCards((prev) => new Set([...prev, slug]))
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    cardRefs.current.forEach((el) => {
      const slug = el.getAttribute('data-slug')
      // Only observe cards that aren't already revealed
      if (slug && !revealedCards.has(slug)) {
        observer.observe(el)
      }
    })

    return () => observer.disconnect()
  }, [initialCardsMarked, revealedCards])

  const setSectionRef = (category: string) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(category, el)
  }

  const setCardRef = (slug: string) => (el: HTMLAnchorElement | null) => {
    if (el) cardRefs.current.set(slug, el)
  }

  // Calculate stagger delay based on card position in grid
  const getCardDelay = (categoryIndex: number, cardIndex: number): number => {
    return cardIndex * 0.08
  }

  return (
    <div className="portfolio-content">
      {/* Grain Texture Overlay */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* Hero */}
      <div className={`portfolio-hero ${heroAnimated ? 'hero-animated' : ''}`}>
        <h1 className="portfolio-name">{photographer.name}</h1>
        <p className="portfolio-title">{photographer.title}</p>
      </div>

      {/* Projects grid by category */}
      {categoriesWithProjects.length > 0 ? (
        <div className="portfolio-sections">
          {categoriesWithProjects.map((category, categoryIndex) => (
            <section
              key={category}
              id={category}
              ref={setSectionRef(category)}
              className={`portfolio-section section-animated ${visibleSections.has(category) ? 'section-visible' : ''}`}
            >
              <h2 className="portfolio-section-title">{categoryLabels[category]}</h2>
              <div className="portfolio-grid">
                {getProjectsByCategory(category).map((project, cardIndex) => (
                  <ProjectCard
                    key={project.slug}
                    ref={setCardRef(project.slug)}
                    project={project}
                    isRevealed={!initialCardsMarked || revealedCards.has(project.slug)}
                    animationDelay={getCardDelay(categoryIndex, cardIndex)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="portfolio-empty">Aucun projet pour le moment.</p>
      )}

      {/* Footer */}
      <div className="portfolio-footer-inline">
        © {new Date().getFullYear()}
      </div>
    </div>
  )
}
