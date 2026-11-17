import { SideNav } from '@/components/layout/SideNav'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Hero } from '@/components/sections/Hero'
import { TabletSection } from '@/components/sections/TabletSection'

function App() {
  return (
    <>
      <SiteHeader />
      <SideNav />
      <main className="bg-navy-900">
        <Hero />
        <TabletSection />
      </main>
    </>
  )
}

export default App
