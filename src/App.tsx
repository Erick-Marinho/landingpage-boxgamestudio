import { useRef } from 'react'
import { Gamepad2 } from 'lucide-react'
import { HeroScene } from '@/components/three/HeroScene'
import { Button } from '@/components/ui/button'
import { gsap, useGSAP } from '@/lib/gsap'

function App() {
  const heroRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.from('[data-animate]', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      })
    },
    { scope: heroRef },
  )

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section
        ref={heroRef}
        className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden px-4 text-center"
      >
        <HeroScene />
        <h1 data-animate className="relative text-4xl font-bold tracking-tight md:text-6xl">
          Box Game Studio
        </h1>
        <p data-animate className="relative max-w-md text-muted-foreground">
          Vite + React + TypeScript + Tailwind + shadcn/ui + GSAP + Three.js
        </p>
        <Button data-animate size="lg" className="relative">
          <Gamepad2 />
          Começar
        </Button>
      </section>
    </main>
  )
}

export default App
