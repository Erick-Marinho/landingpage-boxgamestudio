import { useRef } from 'react'
import logo from '@/assets/brand/logo-box-game-studio.webp'
import { gsap, useGSAP } from '@/lib/gsap'

const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Jogos', href: '#jogos' },
  { label: 'Estúdio', href: '#estudio' },
  { label: 'Imprensa', href: '#imprensa' },
  { label: 'Contato', href: '#contato' },
]

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
    <header ref={headerRef} className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <a href="#inicio" className="shrink-0" aria-label="Box Game Studio — início">
          <img src={logo} alt="Box Game Studio" width={364} height={132} className="h-9 w-auto lg:h-11" />
        </a>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm font-semibold text-mist">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors hover:text-cyan">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
