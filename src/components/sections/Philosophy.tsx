import { useRef } from 'react'
import { Clock3, Sparkles, Trophy, UsersRound } from 'lucide-react'
import { useSection } from '@/hooks/use-section'
import { gsap, useGSAP } from '@/lib/gsap'

type IconMotion = 'clock' | 'trophy' | 'users' | 'sparkles'

/** Os quatro princípios; o ícone usa as cores das faces do cubo (o último, laranja). */
const PRINCIPLES: {
  title: string
  text: string
  icon: typeof Clock3
  tile: string
  motion: IconMotion
}[] = [
  {
    title: 'Seu tempo. Suas regras.',
    text: 'Jogue por cinco minutos ou fique um pouco mais. A diversão deve acompanhar sua rotina, não controlar ela.',
    icon: Clock3,
    tile: 'bg-cyan text-navy-950',
    motion: 'clock',
  },
  {
    title: 'Conquiste de verdade.',
    text: 'Evoluir faz parte da experiência. Nossos jogos valorizam suas conquistas, com progresso alcançado jogando e anúncios opcionais.',
    icon: Trophy,
    tile: 'bg-azure text-snow',
    motion: 'trophy',
  },
  {
    title: 'Melhor quando compartilhado.',
    text: 'Ajude um vizinho, visite uma fazenda ou reúna seu time para uma partida. Cada conexão cria um novo motivo para jogar.',
    icon: UsersRound,
    tile: 'bg-cobalt text-snow',
    motion: 'users',
  },
  {
    title: 'Criatividade com raízes brasileiras.',
    text: 'Nascemos no Brasil e gostamos de colocar nossa identidade em cada experiência, dos pequenos detalhes aos mundos que construímos.',
    icon: Sparkles,
    tile: 'bg-orange text-navy-950',
    motion: 'sparkles',
  },
]

/** Linhas do título: cada uma sobe de trás de uma máscara; a última acende em ciano. */
const TITLE_LINES = ['A diversão', 'vem primeiro.']

/**
 * Microanimação de cada ícone (timeline pausada): toca quando o cartão chega e de novo
 * ao passar o mouse.
 * - relógio: o ponteiro dá uma volta;
 * - troféu: sobe, inclina e brilha;
 * - pessoas: a segunda pessoa chega perto da primeira;
 * - brilhos: as estrelinhas piscam uma a uma.
 */
function iconMotion(kind: IconMotion, tile: HTMLElement) {
  const svg = tile.querySelector('svg')
  const shine = tile.querySelector('[data-shine]')
  const tl = gsap.timeline({ paused: true })
  if (!svg) return tl
  const parts = Array.from(svg.children) as SVGElement[]
  // O reflexo fica escondido (opacity-0 no CSS) até atravessar o ícone
  tl.fromTo(shine, { xPercent: -160, opacity: 1 }, { xPercent: 160, duration: 0.7, ease: 'power2.inOut' }, 0)
  switch (kind) {
    case 'clock':
      // Clock3: círculo + polilinha dos ponteiros, que giram em volta do centro (12, 12)
      tl.fromTo(parts.slice(1), { rotation: -360 }, { rotation: 0, svgOrigin: '12 12', duration: 1.1, ease: 'power3.out' }, 0)
      break
    case 'trophy':
      tl.fromTo(svg, { y: 3, rotation: 0 }, { y: -3, rotation: -10, duration: 0.25, ease: 'power2.out' }, 0).to(svg, {
        y: 0,
        rotation: 0,
        duration: 0.6,
        ease: 'elastic.out(1.2, 0.4)',
      })
      break
    case 'users':
      // UsersRound: [pessoa da frente (2 partes), pessoa de trás (1 parte)]
      tl.fromTo(parts.slice(2), { x: 5, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'back.out(2)' }, 0.05).fromTo(
        parts.slice(0, 2),
        { x: -2 },
        { x: 0, duration: 0.5, ease: 'back.out(2)' },
        0.15,
      )
      break
    case 'sparkles':
      tl.fromTo(
        parts,
        { scale: 0, transformOrigin: '50% 50%' },
        { scale: 1, duration: 0.45, stagger: 0.09, ease: 'back.out(3)' },
        0,
      )
      break
  }
  return tl
}

export function Philosophy() {
  const rootRef = useRef<HTMLElement>(null)
  useSection(rootRef, { id: 'filosofia', label: 'Filosofia', order: 20 })

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      // Título: as linhas sobem por trás das máscaras, uma após a outra; "Sempre." chega por
      // último, com um clarão ciano que assenta.
      gsap
        .timeline({ scrollTrigger: { trigger: '[data-title]', start: 'top 82%', once: true } })
        .from('[data-title-line]', { yPercent: 110, duration: 0.9, stagger: 0.14, ease: 'power4.out' })
        .fromTo(
          '[data-title-glow]',
          { textShadow: '0 0 0 rgb(56 220 255 / 0)' },
          {
            keyframes: [
              { textShadow: '0 0 36px rgb(56 220 255 / 0.85)', duration: 0.35, ease: 'power2.out' },
              { textShadow: '0 0 14px rgb(56 220 255 / 0.25)', duration: 0.9, ease: 'power2.inOut' },
            ],
          },
          '-=0.45',
        )

      // Cartões: entram um por vez, subindo e saindo do desfoque; quando cada um chega, o
      // ícone "liga" (cor + pulso de luz) e faz a sua microanimação.
      const cards = gsap.utils.toArray<HTMLElement>('[data-piece]')
      const motions = cards.map((card, i) => {
        const tile = card.querySelector<HTMLElement>('[data-piece-icon]')
        return tile ? iconMotion(PRINCIPLES[i].motion, tile) : null
      })
      const enter = gsap.timeline({ scrollTrigger: { trigger: '[data-pieces]', start: 'top 78%', once: true } })
      cards.forEach((card, i) => {
        const at = i * 0.18
        const tile = card.querySelector('[data-piece-icon]')
        enter
          .from(
            card,
            { y: 56, autoAlpha: 0, filter: 'blur(10px)', duration: 0.9, ease: 'power3.out', clearProps: 'filter' },
            at,
          )
          .from(tile, { scale: 0.6, filter: 'saturate(0) brightness(0.6)', duration: 0.55, ease: 'back.out(2.4)' }, at + 0.35)
          .fromTo(
            card.querySelector('[data-pulse]'),
            { scale: 1, autoAlpha: 0.7 },
            { scale: 1.9, autoAlpha: 0, duration: 0.8, ease: 'power2.out' },
            at + 0.45,
          )
          .call(() => void motions[i]?.restart(), undefined, at + 0.5)
      })

      // Passar o mouse repete a microanimação do ícone
      const offs = cards.map((card, i) => {
        const replay = () => {
          const motion = motions[i]
          if (motion && !motion.isActive()) motion.restart()
        }
        card.addEventListener('mouseenter', replay)
        return () => card.removeEventListener('mouseenter', replay)
      })
      return () => offs.forEach((off) => off())
    },
    { scope: rootRef },
  )

  return (
    <section
      id="filosofia"
      ref={rootRef}
      aria-labelledby="filosofia-title"
      // Começa na cor do pé do painel do Spike Rush, para não haver emenda
      className="relative overflow-hidden bg-[linear-gradient(180deg,#1b1440_0%,var(--color-navy-900)_35%)] py-24 pr-3.5 pl-3.5 text-snow md:pr-14 lg:py-40 lg:pr-16 lg:pl-4.5"
    >
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="self-start lg:sticky lg:top-32">
          <p data-reveal className="text-xs font-bold tracking-[0.2em] text-orange uppercase sm:text-sm">
            O jeito Box de jogar
          </p>
          <h2
            data-title
            id="filosofia-title"
            className="mt-4 font-heading text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            {TITLE_LINES.map((line) => (
              // Máscara com folga embaixo para os acentos e descendentes não serem cortados
              <span key={line} className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
                <span data-title-line className="block">
                  {line}
                </span>
              </span>
            ))}
            <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
              <span data-title-line className="block">
                <span data-title-glow className="text-cyan">
                  Sempre.
                </span>
              </span>
            </span>
          </h2>
          <p data-reveal className="mt-6 max-w-md text-base leading-relaxed text-mist sm:text-lg">
            Acreditamos que os melhores jogos respeitam seu tempo, valorizam suas conquistas e dão vontade de voltar
            pelo simples prazer de jogar.
          </p>
        </div>

        <ol data-pieces className="grid gap-4 sm:grid-cols-2 lg:gap-5">
          {PRINCIPLES.map((principle, i) => (
            <li
              key={principle.title}
              data-piece
              className="group relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-[translate,border-color,background-color] duration-300 hover:-translate-y-1 hover:border-cyan/40 hover:bg-white/[0.06] lg:p-8"
            >
              <div className="flex items-start justify-between">
                <span className="relative">
                  {/* Pulso de luz quando o ícone liga */}
                  <span
                    data-pulse
                    aria-hidden
                    className={`invisible absolute inset-0 rounded-2xl opacity-0 ${principle.tile}`}
                  />
                  <span
                    data-piece-icon
                    aria-hidden
                    className={`relative grid size-12 place-items-center overflow-hidden rounded-2xl shadow-[0_4px_0_0_rgb(5_11_23/0.6)] transition-[rotate] duration-300 group-hover:-rotate-6 lg:size-14 ${principle.tile}`}
                  >
                    <principle.icon className="relative size-6 overflow-visible lg:size-7" strokeWidth={2} />
                    {/* Reflexo que atravessa o ícone */}
                    <span
                      data-shine
                      className="pointer-events-none absolute inset-y-0 left-0 w-full opacity-0 bg-[linear-gradient(105deg,transparent_30%,rgb(255_255_255/0.55)_50%,transparent_70%)]"
                    />
                  </span>
                </span>
                <span aria-hidden className="font-heading text-sm font-bold text-mist/50">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-10 font-heading text-2xl leading-tight font-extrabold lg:mt-16 lg:text-3xl">
                {principle.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-mist lg:text-base">{principle.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
