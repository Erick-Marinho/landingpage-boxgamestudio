import { type MouseEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Menu, X } from 'lucide-react'
import { ScrollTrigger } from '@/lib/gsap'
import { getStops, scrollToStop, subscribeStops } from '@/lib/scroll-stops'

/** Quanto antes (fração da altura da tela) uma parada já conta como a atual. */
const ACTIVE_OFFSET = 0.35

/**
 * Navegação entre as paradas da página.
 *
 * - Desktop/tablet: pontos na lateral direita, o atual maior e laranja. Ao passar o mouse
 *   sobre um ponto (ou focá-lo pelo teclado), abre ao lado dele uma pílula com o nome
 *   daquela parada; clicar leva até ela.
 * - Celular (sem hover): um botão flutuante no canto inferior direito abre a lista de
 *   pílulas, uma por parada, empilhadas acima dele.
 */
export function SideNav() {
  const stops = useSyncExternalStore(subscribeStops, getStops)
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const mobileRef = useRef<HTMLDivElement>(null)

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

  // Celular: fecha a lista ao tocar fora dela ou com Esc
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!mobileRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (stops.length < 2) return null

  const goTo = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    event.preventDefault()
    setOpen(false)
    scrollToStop(stops[index])
  }

  return (
    <>
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
                  <span
                    aria-hidden
                    className="grid size-4 shrink-0 place-items-center transition-transform group-hover/dot:scale-125"
                  >
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

      {/* Celular: botão flutuante que abre as pílulas */}
      <div ref={mobileRef} className="fixed right-3.5 bottom-4 z-40 flex flex-col items-end md:hidden">
        <nav id="secoes-celular" aria-label="Seções da página" inert={!open}>
          <ul className="mb-3 flex flex-col items-end gap-2">
            {stops.map((stop, i) => {
              const current = i === active
              return (
                <li
                  key={stop.id}
                  className={`transition-[opacity,translate] duration-300 ease-out ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
                  // Abre de baixo para cima, em cascata
                  style={{ transitionDelay: open ? `${(stops.length - 1 - i) * 30}ms` : '0ms' }}
                >
                  <a
                    href={`#${stop.id}`}
                    onClick={(event) => goTo(event, i)}
                    aria-current={current ? 'true' : undefined}
                    className={`flex items-center gap-3 rounded-full border border-white/10 bg-navy-950/90 py-2.5 pr-3 pl-4 text-xs font-medium tracking-[0.2em] uppercase shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6)] backdrop-blur-md ${current ? 'text-orange' : 'text-snow'}`}
                  >
                    {stop.label}
                    <span
                      aria-hidden
                      className={`size-2 rounded-full ${current ? 'bg-orange' : 'bg-mist/60'}`}
                    />
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="secoes-celular"
          aria-label={open ? 'Fechar seções' : 'Abrir seções'}
          onClick={() => setOpen((value) => !value)}
          className="grid size-12 place-items-center rounded-full border border-white/15 bg-navy-950/85 text-snow shadow-[0_8px_24px_-8px_rgb(0_0_0/0.7)] backdrop-blur-md transition-colors active:bg-navy-800"
        >
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </div>
    </>
  )
}
