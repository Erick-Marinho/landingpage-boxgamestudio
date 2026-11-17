import { SiteHeader } from '@/components/layout/SiteHeader'
import { Hero } from '@/components/sections/Hero'
import { TabletSection } from '@/components/sections/TabletSection'

function App() {
  return (
    <>
      <SiteHeader />
      <main className="bg-navy-900">
        <Hero />
        <TabletSection />
      </main>
    </>
  )
}

export default App
