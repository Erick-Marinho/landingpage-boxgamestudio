import { SiteHeader } from '@/components/layout/SiteHeader'
import { Hero } from '@/components/sections/Hero'

function App() {
  return (
    <>
      <SiteHeader />
      <main className="bg-navy-900">
        <Hero />
      </main>
    </>
  )
}

export default App
