import { type MouseEvent, useEffect, useState, useSyncExternalStore } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import { getStops, subscribeStops } from '@/lib/scroll-stops'

/** Quanto antes (fração da altura da tela) uma parada já conta como a atual. */
const ACTIVE_OFFSET = 0.35

/**
 * Navegação lateral: um ponto por parada da página, o atual maior e laranja.
 * Ao passar o mouse sobre um ponto (ou focá-lo pelo teclado), abre ao lado dele uma pílula
 * com o nome daquela parada; clicar leva até ela.
 */
export function SideNav() {
  const stops = useSyncExternalStore(subscribeStops, getStops)
  const [active, setActive] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY + window.innerHeight * ACTIVE_OFFSET
      let index = 0
      stops.forEach((stop, i) => {
        if (stop.getY() <= y) index = i
      })
      setActive(index)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    // As posições das cenas fixas só existem depois que o ScrollTrigger mede a página
    ScrollTrigger.addEventListener('refresh', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      ScrollTrigger.removeEventListener('refresh', schedule)
    }
  }, [stops])

  if (stops.length < 2) return null

  const goTo = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    event.preventDefault()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: stops[index].getY(), behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <nav
      aria-label="Seções da página"
      className="fixed top-1/2 right-3.5 z-40 hidden -translate-y-1/2 md:block lg:right-4.5"
    >
      <ul className="flex flex-col items-center gap-1">
        {stops.map((stop, i) => {
          const current = i === active
          return (
            <li key={stop.id}>
              <a
                href={`#${stop.id}`}
                onClick={(event) => goTo(event, i)}
                aria-current={current ? 'true' : undefined}
                className="group/dot relative grid size-6 place-items-center rounded-full outline-none"
              >
                {/* Pílula com o nome: só a do ponto sob o mouse (ou com foco do teclado) */}
                <span
                  className={`pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 translate-x-1 rounded-full border border-white/10 bg-navy-950/85 px-3.5 py-1.5 text-[11px] font-medium tracking-[0.2em] whitespace-nowrap uppercase opacity-0 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6)] backdrop-blur-md transition-[opacity,translate] duration-200 group-hover/dot:translate-x-0 group-hover/dot:opacity-100 group-focus-visible/dot:translate-x-0 group-focus-visible/dot:opacity-100 ${current ? 'text-orange' : 'text-snow'}`}
                >
                  {stop.label}
                </span>
                {/* Ponto: área fixa para todos alinharem; o atual é maior e laranja */}
                <span aria-hidden className="grid size-4 shrink-0 place-items-center transition-transform group-hover/dot:scale-125">
                  <span
                    // Anel escuro: o ponto aparece até sobre fundos claros ou laranja
                    className={`rounded-full transition-all duration-300 ${
                      current
                        ? 'size-3.5 bg-orange shadow-[0_0_0_2px_rgb(5_11_23/0.85)]'
                        : 'size-2.5 bg-mist/70 shadow-[0_0_0_1px_rgb(5_11_23/0.35)]'
                    }`}
                  />
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
