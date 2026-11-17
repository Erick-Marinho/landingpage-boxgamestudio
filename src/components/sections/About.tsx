import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import cubeSymbol from '@/assets/brand/simbolo-cubo.svg'
import { useSection } from '@/hooks/use-section'
import { gsap, useGSAP } from '@/lib/gsap'
import { externalProps, SITE_LINKS } from '@/lib/site-links'

const FACTS = [
  { value: '2013', label: 'Desde' },
  { value: 'Brasil', label: 'Feito no' },
  { value: '2', label: 'Jogos' },
]

export function About() {
  const rootRef = useRef<HTMLElement>(null)
  useSection(rootRef, { id: 'estudio', label: 'Estúdio', order: 30 })

  // O símbolo flutua devagar e o "2013" de fundo desliza com o scroll (parallax leve)
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.to('[data-about="symbol"]', { y: -14, rotate: -3, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      gsap.fromTo(
        '[data-about="year"]',
        { xPercent: 8 },
        { xPercent: -8, ease: 'none', scrollTrigger: { trigger: rootRef.current, start: 'top bottom', end: 'bottom top', scrub: true } },
      )
    },
    { scope: rootRef },
  )

  return (
    <section
      id="estudio"
      ref={rootRef}
      aria-labelledby="estudio-title"
      className="relative overflow-hidden bg-navy-950 px-3.5 py-24 text-snow lg:px-4.5 lg:py-40"
    >
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Visual: o símbolo sobre o ano de fundação, em contorno */}
        <div aria-hidden className="relative grid place-items-center py-10 lg:order-2 lg:py-0">
          <span
            data-about="year"
            className="pointer-events-none absolute font-heading text-[clamp(7rem,24vw,22rem)] leading-none font-extrabold tracking-tighter text-transparent [-webkit-text-stroke:2px_rgb(82_211_255/0.18)]"
          >
            2013
          </span>
          <div className="absolute size-[60%] rounded-full bg-[radial-gradient(circle,rgb(4_159_223/0.35),transparent_65%)]" />
          <img
            data-about="symbol"
            src={cubeSymbol}
            alt=""
            className="relative w-[46%] max-w-xs drop-shadow-[0_30px_40px_rgb(0_0_0/0.5)]"
          />
        </div>

        <div>
          <p data-reveal className="text-xs font-bold tracking-[0.2em] text-orange uppercase sm:text-sm">
            Prazer, somos a Box
          </p>
          <h2
            data-reveal
            id="estudio-title"
            className="mt-4 font-heading text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl"
          >
            Independentes por essência. <span className="text-cyan">Criativos por natureza.</span>
          </h2>
          <div data-reveal className="mt-6 max-w-xl space-y-4 text-base leading-relaxed text-mist sm:text-lg">
            <p>A Box Game Studio nasceu no Brasil, em 2013, fundada por Luiz Felipe Teixeira.</p>
            <p>
              Somos movidos pela vontade de transformar ideias em mundos interativos, personagens marcantes e
              experiências que fazem cada minuto valer a pena.
            </p>
            <p>
              De fazendas tranquilas a partidas competitivas, exploramos diferentes maneiras de fazer algo que amamos:
              criar jogos.
            </p>
          </div>

          <dl data-reveal className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {FACTS.map((fact) => (
              <div key={fact.value}>
                <dt className="text-xs tracking-[0.15em] text-mist/70 uppercase">{fact.label}</dt>
                <dd className="mt-1 font-heading text-2xl font-extrabold sm:text-3xl">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <a
            data-reveal
            href={SITE_LINKS.studio}
            {...externalProps(SITE_LINKS.studio)}
            className="mt-10 inline-flex h-12 items-center gap-2 rounded-xl border-2 border-cyan/70 px-6 text-base font-bold text-cyan shadow-[0_4px_0_0_var(--color-cobalt)] transition-[translate,background-color] hover:-translate-y-0.5 hover:bg-cyan/10"
          >
            Conheça nosso estúdio
            <ArrowRight aria-hidden className="size-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
