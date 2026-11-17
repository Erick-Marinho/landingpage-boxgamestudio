import { useRef } from 'react'
import { Clock3, Sparkles, Trophy, UsersRound } from 'lucide-react'
import { useSection } from '@/hooks/use-section'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * De onde cada cartão vem ao encaixar, como peças do cubo chegando de lados diferentes:
 * esquerda, cima, baixo e direita, girando de leve.
 */
const PIECE_FROM = [
  { x: -140, y: 0, rotate: -10 },
  { x: 0, y: -120, rotate: 8 },
  { x: 0, y: 140, rotate: -6 },
  { x: 140, y: 0, rotate: 10 },
]

/** Os quatro princípios; o ícone usa as cores das faces do cubo (o último, laranja). */
const PRINCIPLES = [
  {
    title: 'Seu tempo. Suas regras.',
    text: 'Jogue por cinco minutos ou fique um pouco mais. A diversão deve acompanhar sua rotina, não controlar ela.',
    icon: Clock3,
    tile: 'bg-cyan text-navy-950',
  },
  {
    title: 'Conquiste de verdade.',
    text: 'Evoluir faz parte da experiência. Nossos jogos valorizam suas conquistas, com progresso alcançado jogando e anúncios opcionais.',
    icon: Trophy,
    tile: 'bg-azure text-snow',
  },
  {
    title: 'Melhor quando compartilhado.',
    text: 'Ajude um vizinho, visite uma fazenda ou reúna seu time para uma partida. Cada conexão cria um novo motivo para jogar.',
    icon: UsersRound,
    tile: 'bg-cobalt text-snow',
  },
  {
    title: 'Criatividade com raízes brasileiras.',
    text: 'Nascemos no Brasil e gostamos de colocar nossa identidade em cada experiência, dos pequenos detalhes aos mundos que construímos.',
    icon: Sparkles,
    tile: 'bg-orange text-navy-950',
  },
]

export function Philosophy() {
  const rootRef = useRef<HTMLElement>(null)
  useSection(rootRef, { id: 'filosofia', label: 'Filosofia', order: 20 })

  // Os cartões encaixam um por vez, ligados ao scroll: cada um chega de um lado, gira até
  // o lugar e "trava" com um pequeno quique; o ícone acende quando a peça encaixa.
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const pieces = gsap.utils.toArray<HTMLElement>('[data-piece]')
      const assemble = gsap.timeline({
        scrollTrigger: { trigger: '[data-pieces]', start: 'top 85%', end: 'bottom 75%', scrub: 0.6 },
      })
      pieces.forEach((piece, i) => {
        const at = i * 0.8
        assemble
          .from(
            piece,
            { ...PIECE_FROM[i % PIECE_FROM.length], scale: 0.85, autoAlpha: 0, duration: 1, ease: 'back.out(1.7)' },
            at,
          )
          .from(
            piece.querySelector('[data-piece-icon]'),
            { scale: 0.5, filter: 'saturate(0) brightness(0.55)', duration: 0.5, ease: 'back.out(2.5)' },
            at + 0.6,
          )
      })
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
            data-reveal
            id="filosofia-title"
            className="mt-4 font-heading text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            A diversão vem primeiro. <span className="text-cyan">Sempre.</span>
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
                <span
                  data-piece-icon
                  aria-hidden
                  className={`grid size-12 place-items-center rounded-2xl shadow-[0_4px_0_0_rgb(5_11_23/0.6)] transition-[rotate] duration-300 group-hover:-rotate-6 lg:size-14 ${principle.tile}`}
                >
                  <principle.icon className="size-6 lg:size-7" strokeWidth={2} />
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
