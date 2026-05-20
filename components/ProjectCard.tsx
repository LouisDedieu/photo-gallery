'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ProjectWithCover } from '@/lib/gallery'

interface ProjectCardProps {
  project: ProjectWithCover
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/gallery/${project.slug}`} className="project-card">
      <div className="project-card-image">
        {project.coverUrl ? (
          <Image
            src={project.coverUrl}
            alt={project.title}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="project-card-placeholder" />
        )}
      </div>
      <div className="project-card-overlay">
        <span className="project-card-title">{project.title}</span>
      </div>
    </Link>
  )
}
