'use client'

import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { ProjectWithCover } from '@/lib/gallery'

interface ProjectCardProps {
  project: ProjectWithCover
  isRevealed?: boolean
  animationDelay?: number
}

export const ProjectCard = forwardRef<HTMLAnchorElement, ProjectCardProps>(
  function ProjectCard({ project, isRevealed = true, animationDelay = 0 }, forwardedRef) {
  const cardRef = useRef<HTMLAnchorElement>(null)

  useImperativeHandle(forwardedRef, () => cardRef.current!)
  const innerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current || !innerRef.current || !imageRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Calculate rotation (max 8 degrees)
    const rotateX = ((y - centerY) / centerY) * -8
    const rotateY = ((x - centerX) / centerX) * 8

    // Apply 3D tilt
    innerRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`

    // Parallax on image (opposite direction, subtle)
    const parallaxX = ((x - centerX) / centerX) * -8
    const parallaxY = ((y - centerY) / centerY) * -8
    const img = imageRef.current.querySelector('img')
    if (img) {
      img.style.transform = `translate(${parallaxX}px, ${parallaxY}px) scale(1.1)`
    }

    // Update shine position
    if (shineRef.current) {
      const percentX = (x / rect.width) * 100
      const percentY = (y / rect.height) * 100
      shineRef.current.style.setProperty('--mouse-x', `${percentX}%`)
      shineRef.current.style.setProperty('--mouse-y', `${percentY}%`)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!innerRef.current || !imageRef.current) return

    // Reset transforms with smooth transition
    innerRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'

    const img = imageRef.current.querySelector('img')
    if (img) {
      img.style.transform = 'translate(0, 0) scale(1)'
    }
  }, [])

  return (
    <Link
      ref={cardRef}
      href={`/gallery/${project.slug}`}
      data-slug={project.slug}
      className={`project-card project-card-3d project-card-parallax card-reveal ${isRevealed ? 'revealed' : ''}`}
      style={{ animationDelay: `${animationDelay}s` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={innerRef} className="project-card-inner">
        <div ref={imageRef} className="project-card-image">
          {project.coverUrl ? (
            <Image
              src={project.coverUrl}
              alt={project.title}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              style={{ objectFit: 'cover', transition: 'transform 0.2s ease-out' }}
            />
          ) : (
            <div className="project-card-placeholder" />
          )}
        </div>
        <div ref={shineRef} className="project-card-shine" />
        <div className="project-card-overlay">
          <span className="project-card-title">{project.title}</span>
        </div>
      </div>
    </Link>
  )
})
