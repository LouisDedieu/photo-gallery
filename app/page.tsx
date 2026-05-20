import { AppShell } from '@/components/AppShell'
import { PortfolioContent } from '@/components/PortfolioContent'
import { getProjectsWithCovers } from '@/lib/gallery'

export default async function Home() {
  const projectsWithCovers = await getProjectsWithCovers()

  return (
    <AppShell>
      <PortfolioContent projects={projectsWithCovers} />
    </AppShell>
  )
}
