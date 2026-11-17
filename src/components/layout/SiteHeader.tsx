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
      {/* Margem lateral = distância do topo até o logo ((h-16 − h-9) / 2 e (h-20 − h-11) / 2) */}
      <div className="flex h-16 items-center justify-between px-3.5 lg:h-20 lg:px-4.5">
        <a href="#inicio" className="shrink-0" aria-label="Box Game Studio — início">
          <img src={logo} alt="Box Game Studio" width={364} height={132} className="h-9 w-auto lg:h-11" />
        </a>

        {/* Itens em caixa alta, espaçados, distribuídos por toda a largura depois do logo */}
        <nav aria-label="Principal" className="ml-[6vw] hidden flex-1 md:block">
          <ul className="flex items-center justify-between text-xs font-medium tracking-[0.2em] text-snow uppercase lg:text-[15px]">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="relative py-2 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-cyan after:transition-transform hover:text-cyan hover:after:scale-x-100"
                >
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
