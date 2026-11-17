import { useRef } from 'react'
import { Clock3, Sparkles, Trophy, UsersRound } from 'lucide-react'
import { useSection } from '@/hooks/use-section'

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

  return (
    <section
      id="filosofia"
      ref={rootRef}
      aria-labelledby="filosofia-title"
      // Começa na cor do pé do painel do Spike Rush, para não haver emenda
      className="relative overflow-hidden bg-[linear-gradient(180deg,#1b1440_0%,var(--color-navy-900)_35%)] px-3.5 py-24 text-snow lg:px-4.5 lg:py-40"
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

        <ol className="grid gap-4 sm:grid-cols-2 lg:gap-5">
          {PRINCIPLES.map((principle, i) => (
            <li
              key={principle.title}
              data-reveal
              className="group relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-[translate,border-color,background-color] duration-300 hover:-translate-y-1 hover:border-cyan/40 hover:bg-white/[0.06] lg:p-8"
            >
              <div className="flex items-start justify-between">
                <span
                  aria-hidden
                  className={`grid size-12 place-items-center rounded-2xl shadow-[0_4px_0_0_rgb(5_11_23/0.6)] transition-transform duration-300 group-hover:-rotate-6 lg:size-14 ${principle.tile}`}
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
