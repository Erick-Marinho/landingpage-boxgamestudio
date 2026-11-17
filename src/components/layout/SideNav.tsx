import { type MouseEvent, useEffect, useState, useSyncExternalStore } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import { getStops, subscribeStops } from '@/lib/scroll-stops'

/** Quanto antes (fração da altura da tela) uma parada já conta como a atual. */
const ACTIVE_OFFSET = 0.35

/**
 * Navegação lateral: um ponto por parada da página, o atual maior e laranja.
 * Ao passar o mouse (ou focar pelo teclado), abre uma pílula com o nome de cada parada
 * ao lado do seu ponto, para escolher para onde ir.
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
      className="group fixed top-1/2 right-3.5 z-40 hidden -translate-y-1/2 md:block lg:right-4.5"
    >
      <ul className="flex flex-col items-end gap-0.5 rounded-[26px] border border-transparent p-1.5 transition-[background-color,border-color,backdrop-filter] duration-300 group-focus-within:border-white/10 group-focus-within:bg-navy-950/80 group-focus-within:backdrop-blur-md group-hover:border-white/10 group-hover:bg-navy-950/80 group-hover:backdrop-blur-md">
        {stops.map((stop, i) => {
          const current = i === active
          return (
            <li key={stop.id}>
              <a
                href={`#${stop.id}`}
                onClick={(event) => goTo(event, i)}
                aria-current={current ? 'true' : undefined}
                className="flex items-center justify-end gap-3 rounded-full py-1.5 pr-1 pl-1 outline-none transition-colors group-hover:pl-3.5 group-focus-within:pl-3.5 hover:bg-white/10 focus-visible:bg-white/10"
              >
                <span
                  className={`max-w-0 overflow-hidden text-[11px] font-medium tracking-[0.2em] whitespace-nowrap uppercase opacity-0 transition-[max-width,opacity] duration-300 group-focus-within:max-w-48 group-focus-within:opacity-100 group-hover:max-w-48 group-hover:opacity-100 ${current ? 'text-orange' : 'text-snow'}`}
                >
                  {stop.label}
                </span>
                {/* Ponto: área fixa para todos alinharem; o atual é maior e laranja */}
                <span aria-hidden className="grid size-4 shrink-0 place-items-center">
                  <span
                    className={`rounded-full shadow-[0_0_0_1px_rgb(5_11_23/0.35)] transition-all duration-300 ${
                      current ? 'size-3.5 bg-orange' : 'size-2.5 bg-mist/70'
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
