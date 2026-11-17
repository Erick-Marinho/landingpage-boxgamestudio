import { SideNav } from '@/components/layout/SideNav'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { About } from '@/components/sections/About'
import { Community } from '@/components/sections/Community'
import { Contact } from '@/components/sections/Contact'
import { Hero } from '@/components/sections/Hero'
import { Philosophy } from '@/components/sections/Philosophy'
import { TabletSection } from '@/components/sections/TabletSection'

function App() {
  return (
    <>
      <SiteHeader />
      <SideNav />
      <main className="bg-navy-900">
        <Hero />
        <TabletSection />
        <Philosophy />
        <About />
        <Community />
        <Contact />
      </main>
      <SiteFooter />
    </>
  )
}

export default App
