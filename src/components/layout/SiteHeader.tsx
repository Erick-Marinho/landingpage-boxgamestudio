import { useRef } from 'react'
import logo from '@/assets/brand/logo-box-game-studio.webp'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * Cabeçalho: só o logo, centralizado. A navegação entre as seções fica na lateral
 * (pontos) e no rodapé.
 */
export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.from(headerRef.current, { y: -16, autoAlpha: 0, duration: 0.7, delay: 0.1, ease: 'power3.out' })
    },
    { scope: headerRef },
  )

  return (
    <header ref={headerRef} className="pointer-events-none absolute inset-x-0 top-0 z-50">
      <div className="flex h-16 items-center justify-center lg:h-20">
        <a href="#inicio" className="pointer-events-auto shrink-0" aria-label="Box Game Studio — início">
          <img src={logo} alt="Box Game Studio" width={364} height={132} className="h-9 w-auto lg:h-11" />
        </a>
      </div>
    </header>
  )
}
