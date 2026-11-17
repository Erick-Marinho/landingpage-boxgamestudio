import { useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useSection } from '@/hooks/use-section'
import { gsap, useGSAP } from '@/lib/gsap'
import { externalProps, SITE_LINKS } from '@/lib/site-links'

/** Caixinhas decorativas (posição em %, tamanho em px, cor e giro), como peças soltas do cubo. */
const BOXES = [
  { x: 8, y: 18, size: 34, tone: 'bg-cyan', rotate: -14 },
  { x: 86, y: 14, size: 52, tone: 'bg-navy-950', rotate: 12 },
  { x: 74, y: 70, size: 28, tone: 'bg-snow', rotate: -8 },
  { x: 92, y: 52, size: 22, tone: 'bg-cobalt', rotate: 20 },
  { x: 16, y: 80, size: 44, tone: 'bg-azure', rotate: 6 },
  { x: 60, y: 10, size: 18, tone: 'bg-navy-950', rotate: -24 },
]

export function Community() {
  const rootRef = useRef<HTMLElement>(null)
  useSection(rootRef, { id: 'comunidade', label: 'Comunidade', order: 40 })

  // As caixinhas flutuam em ritmos diferentes e se espalham um pouco com o scroll
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.utils.toArray<HTMLElement>('[data-box]').forEach((box, i) => {
        gsap.to(box, {
          y: i % 2 ? 12 : -12,
          rotate: `+=${i % 2 ? 10 : -10}`,
          duration: 2.4 + i * 0.35,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })
      gsap.from('[data-box]', {
        scale: 0,
        stagger: 0.06,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: rootRef.current, start: 'top 75%', end: 'top 35%', scrub: true },
      })
    },
    { scope: rootRef },
  )

  return (
    <section
      id="comunidade"
      ref={rootRef}
      aria-labelledby="comunidade-title"
      className="bg-navy-950 px-3.5 pb-24 lg:px-4.5 lg:pb-40"
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(ellipse_at_80%_0%,#ffb066_0%,transparent_55%),linear-gradient(135deg,var(--color-orange)_0%,#ff6f0f_100%)] px-6 py-20 text-navy-950 sm:px-12 lg:rounded-[2.5rem] lg:px-20 lg:py-32">
        {BOXES.map((box, i) => (
          <span
            key={i}
            data-box
            aria-hidden
            className={`absolute rounded-[22%] border-2 border-navy-950 shadow-[0_4px_0_0_rgb(5_11_23/0.55)] max-md:hidden ${box.tone}`}
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: box.size,
              height: box.size,
              rotate: `${box.rotate}deg`,
            }}
          />
        ))}

        <div className="relative mx-auto max-w-3xl text-center">
          <p data-reveal className="text-xs font-bold tracking-[0.2em] uppercase opacity-75 sm:text-sm">
            Além da tela
          </p>
          <h2
            data-reveal
            id="comunidade-title"
            className="mt-4 font-heading text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-8xl"
          >
            O jogo continua por aqui.
          </h2>
          <div data-reveal className="mx-auto mt-6 max-w-xl space-y-3 text-base leading-relaxed font-medium sm:text-lg">
            <p>
              Cada lançamento tem uma história. Cada atualização traz uma novidade. E sempre existe algo acontecendo nos
              bastidores.
            </p>
            <p>Acompanhe nossos projetos, descubra o que estamos preparando e faça parte da nossa comunidade.</p>
          </div>
          <a
            data-reveal
            href={SITE_LINKS.instagram}
            {...externalProps(SITE_LINKS.instagram)}
            className="mt-10 inline-flex h-12 items-center gap-2 rounded-xl bg-navy-950 px-6 text-base font-bold text-snow shadow-[0_4px_0_0_rgb(5_11_23/0.45)] transition-[translate,background-color] hover:-translate-y-0.5 hover:bg-navy-800"
          >
            Acompanhar no Instagram
            <ArrowUpRight aria-hidden className="size-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
