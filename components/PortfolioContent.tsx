'use client'

import { photographer, categories, categoryLabels, type Category } from '@/lib/portfolio-config'
import type { ProjectWithCover } from '@/lib/gallery'
import { ProjectCard } from './ProjectCard'

interface PortfolioContentProps {
  projects: ProjectWithCover[]
}

export function PortfolioContent({ projects }: PortfolioContentProps) {
  const getProjectsByCategory = (category: Category) =>
    projects.filter((p) => p.category === category)

  const categoriesWithProjects = categories.filter(
    (cat) => getProjectsByCategory(cat).length > 0
  )

  return (
    <div className="portfolio-content">
      {/* Hero */}
      <div className="portfolio-hero">
        <h1 className="portfolio-name">{photographer.name}</h1>
        <p className="portfolio-title">{photographer.title}</p>
      </div>

      {/* Projects grid by category */}
      {categoriesWithProjects.length > 0 ? (
        <div className="portfolio-sections">
          {categoriesWithProjects.map((category) => (
            <section key={category} id={category} className="portfolio-section">
              <h2 className="portfolio-section-title">{categoryLabels[category]}</h2>
              <div className="portfolio-grid">
                {getProjectsByCategory(category).map((project) => (
                  <ProjectCard key={project.slug} project={project} />
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
