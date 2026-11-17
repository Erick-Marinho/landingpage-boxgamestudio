import { useEffect, useRef } from 'react'
import { ArrowDown, ArrowRight, Play, Sprout, Volleyball } from 'lucide-react'
import { createHeroWorld, HERO_WORLD_REVEAL_AT } from '@/components/three/hero-world'
import { Button } from '@/components/ui/button'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap'
import { registerStops } from '@/lib/scroll-stops'

/** Quando a cena 3D entra na timeline principal. */
const WORLD_START = 0.15
/**
 * Abertura por scroll: quanto de scroll (em alturas de tela) cada fase dura com o hero fixo.
 * 1 = "destravar", 2 = "abrir", 3 = "presente", 4 = os jogos saem da caixa.
 */
const UNBOX_PHASES = { unlock: 0.6, open: 0.9, reveal: 0.9, game: 0.9 }
const UNBOX_SCROLL_SCREENS = UNBOX_PHASES.unlock + UNBOX_PHASES.open + UNBOX_PHASES.reveal + UNBOX_PHASES.game

/** Os dois jogos que saem da caixa (textos de docs/copy-pagina-inicial.md). */
const GAMES = [
  {
    name: 'Vida na Fazenda',
    tagline: 'Um mundo que cresce com você.',
    note: 'Grátis no navegador',
    icon: Sprout,
    art: 'bg-[radial-gradient(circle_at_28%_22%,#fef3c7_0,transparent_38%),linear-gradient(165deg,#86efac_0%,#22c55e_45%,#166534_100%)]',
  },
  {
    name: 'Spike Rush',
    tagline: 'O próximo ponto é seu.',
    note: 'Grátis no navegador',
    icon: Volleyball,
    art: 'bg-[radial-gradient(circle_at_72%_20%,#fff7ed_0,transparent_32%),linear-gradient(180deg,#7dd3fc_0%,#0ea5e9_55%,#fbbf24_55%,#f59e0b_100%)]',
  },
]

/** Liga/desliga o foco e o clique de um bloco que está visível ou escondido pela animação. */
function setInert(el: HTMLElement | null, inert: boolean) {
  if (el && el.inert !== inert) el.inert = inert
}

export function Hero() {
  const rootRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const heroTextRef = useRef<HTMLDivElement>(null)
  const nextTitleRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  // Primeira parada da navegação lateral
  useEffect(() => registerStops([{ id: 'inicio', label: 'Início', order: 0, getY: () => 0 }]), [])

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const world = sceneRef.current
        ? createHeroWorld(sceneRef.current, { reducedMotion, textElement: contentRef.current })
        : null

      SplitText.create(titleRef.current, { type: 'words', mask: 'words', wordsClass: 'hero-word' })
      const lineOne = gsap.utils.toArray<HTMLElement>('[data-line="1"] .hero-word')
      const lineTwo = gsap.utils.toArray<HTMLElement>('[data-line="2"] .hero-word')

      // "Uma pausa." entra com a montagem; "Um universo inteiro." quando o cubo se abre.
      const lineTwoAt = world ? WORLD_START + HERO_WORLD_REVEAL_AT - 0.05 : 0.7

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from(lineOne, { yPercent: 115, duration: 0.9, stagger: 0.08, ease: 'power4.out' }, 0.35)
        .from(lineTwo, { yPercent: 115, duration: 0.9, stagger: 0.08, ease: 'power4.out' }, lineTwoAt)
        .from('[data-hero="reveal"]', { y: 20, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, lineTwoAt + 0.45)
        .from('[data-hero="cue"]', { autoAlpha: 0, duration: 0.6 }, '>-0.2')
      if (world) tl.add(world.intro, WORLD_START)

      if (reducedMotion) {
        tl.progress(1)
        world?.render()
        return () => world?.dispose()
      }

      gsap.to('[data-hero="cue-icon"]', { y: 6, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' })

      // Fase 4: o texto do hero dá lugar ao título dos jogos e os cartões saem da caixa,
      // abrindo em leque com um pequeno pulo no fim. Controlada pelo scroll (progresso).
      const cards = gsap.utils.toArray<HTMLElement>('[data-game-card]')
      const gameTl = gsap.timeline({ paused: true })
      gameTl
        .to(heroTextRef.current, { x: -48, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0)
        .fromTo(
          nextTitleRef.current,
          { y: 28, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out' },
          0.3,
        )
        .fromTo(
          cards,
          { y: 140, xPercent: (i: number) => (i === 0 ? 55 : -55), scale: 0.8, rotate: 0, autoAlpha: 0 },
          {
            y: 0,
            xPercent: 0,
            scale: 1,
            rotate: (i: number) => (i === 0 ? -6 : 6),
            autoAlpha: 1,
            duration: 0.6,
            ease: 'back.out(1.8)',
            stagger: 0.12,
          },
          0.1,
        )
      setInert(cardsRef.current, true)

      // Os cartões acompanham a abertura da caixa na tela (a cena suaviza o movimento)
      const followBox = () => {
        if (!world || !anchorRef.current || gameTl.progress() <= 0) return
        const { x, y } = world.getAnchor()
        anchorRef.current.style.left = `${x}px`
        anchorRef.current.style.top = `${y}px`
      }
      gsap.ticker.add(followBox)

      // Abertura por scroll com o hero fixo. Fase 1: o cubo para, vira para a pose de
      // vitrine e se solta. Fase 2: as caixinhas se afastam e a laranja acende no centro.
      // Fase 3: a laranja vem para a frente e abre a tampa. Fase 4: os jogos.
      // Usa o progresso bruto; a cena suaviza.
      const unbox = ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: () => `+=${window.innerHeight * UNBOX_SCROLL_SCREENS}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const screens = self.progress * UNBOX_SCROLL_SCREENS
          world?.setUnlock(gsap.utils.clamp(0, 1, screens / UNBOX_PHASES.unlock))
          world?.setOpen(gsap.utils.clamp(0, 1, (screens - UNBOX_PHASES.unlock) / UNBOX_PHASES.open))
          const revealStart = UNBOX_PHASES.unlock + UNBOX_PHASES.open
          world?.setReveal(gsap.utils.clamp(0, 1, (screens - revealStart) / UNBOX_PHASES.reveal))
          const game = gsap.utils.clamp(0, 1, (screens - revealStart - UNBOX_PHASES.reveal) / UNBOX_PHASES.game)
          gameTl.progress(game)
          // Botões "Jogar" só respondem com os cartões no lugar; o texto antigo sai do foco
          setInert(cardsRef.current, game < 0.85)
          setInert(heroTextRef.current, game > 0.3)
        },
      })

      // Scroll de saída (depois da abertura): o cubo se desmonta e o texto sobe
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: () => unbox.end,
        end: () => unbox.end + (rootRef.current?.offsetHeight ?? window.innerHeight),
        invalidateOnRefresh: true,
        onUpdate: (self) => world?.setScroll(self.progress),
      })
      gsap.to(contentRef.current, {
        yPercent: -12,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: () => unbox.end,
          end: () => unbox.end + (rootRef.current?.offsetHeight ?? window.innerHeight) * 0.7,
          invalidateOnRefresh: true,
          scrub: true,
        },
      })
      gsap.to(cardsRef.current, {
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: () => unbox.end,
          end: () => unbox.end + (rootRef.current?.offsetHeight ?? window.innerHeight) * 0.7,
          invalidateOnRefresh: true,
          scrub: true,
        },
      })

      return () => {
        gsap.ticker.remove(followBox)
        world?.dispose()
      }
    },
    { scope: rootRef },
  )

  // z-10: o hero fica acima da seção do tablet; a camada do vídeo de lá vazava 1 px
  // acima da própria borda (um fio claro na emenda) e assim fica coberta pelo hero.
  return (
    <section
      id="inicio"
      ref={rootRef}
      aria-labelledby="hero-title"
      className="relative isolate z-10 flex min-h-svh overflow-hidden bg-navy-900 text-snow"
    >
      {/* Fundo: azul-noite com um brilho atrás do cubo */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_50%_28%,rgb(4_159_223/0.30),transparent_55%),linear-gradient(180deg,var(--color-navy-950)_0%,var(--color-navy-900)_50%,var(--color-navy-800)_100%)] lg:bg-[radial-gradient(ellipse_at_74%_50%,rgb(4_159_223/0.30),transparent_50%),linear-gradient(180deg,var(--color-navy-950)_0%,var(--color-navy-900)_50%,var(--color-navy-800)_100%)]"
      />
      {/* Cena 3D (recebe arrastar/tocar no cubo) */}
      <div ref={sceneRef} aria-hidden className="absolute inset-0 -z-20" />
      {/* Véus para legibilidade do texto. O de baixo também fecha o hero em navy-900 puro,
          a mesma cor em que a seção seguinte (tablet) começa — sem emenda entre as duas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-linear-to-t from-navy-900 via-navy-900/75 to-transparent lg:h-32 lg:via-navy-900/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden w-2/3 bg-linear-to-r from-navy-900/85 via-navy-900/40 to-transparent lg:block"
      />

      {/* pointer-events-none no contêiner para o cubo receber cliques fora do texto */}
      <div className="pointer-events-none flex w-full flex-col justify-end px-3.5 pt-28 pb-10 max-lg:short:pt-20 max-lg:short:pb-6 sm:pb-16 lg:justify-center lg:px-4.5 lg:pb-24">
        <div ref={contentRef} className="pointer-events-auto relative max-w-xl">
          <div ref={heroTextRef}>
            <h1
              id="hero-title"
              ref={titleRef}
              className="font-heading text-5xl leading-[0.95] font-extrabold tracking-tight text-balance max-lg:short:text-[2.5rem] sm:text-6xl lg:text-7xl xl:text-8xl"
            >
              <span data-line="1" className="block">
                Uma pausa.
              </span>{' '}
              <span data-line="2" className="block text-cyan">
                Um universo inteiro.
              </span>
            </h1>

            <p
              data-hero="reveal"
              className="mt-6 max-w-md text-base leading-relaxed text-mist max-lg:short:mt-3 max-lg:short:text-sm sm:text-lg"
            >
              Cultive, compita, descubra. Criamos jogos que transformam pequenos momentos do seu dia em grandes
              experiências.
            </p>

            <div data-hero="reveal" className="mt-8 flex flex-col gap-4 max-lg:short:mt-5 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-orange px-6 text-base font-bold text-navy-950 shadow-[0_4px_0_0_var(--color-ember)] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-orange-soft hover:shadow-[0_6px_0_0_var(--color-ember)] active:translate-y-0.5 active:shadow-[0_1px_0_0_var(--color-ember)]"
              >
                <a href="#jogos">
                  Explore nossos jogos
                  <ArrowRight data-icon="inline-end" className="transition-transform group-hover/button:translate-x-0.5" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-2 border-cyan/70 bg-transparent px-6 text-base font-bold text-cyan shadow-[0_4px_0_0_var(--color-cobalt)] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-cyan/10 hover:text-cyan hover:shadow-[0_6px_0_0_var(--color-cobalt)] active:translate-y-0.5 active:shadow-[0_1px_0_0_var(--color-cobalt)] dark:bg-transparent"
              >
                <a href="#jogos">
                  <Play data-icon="inline-start" className="fill-current" />
                  Jogue agora
                </a>
              </Button>
            </div>
          </div>

          {/* Fase 4: o título dos jogos ocupa o lugar do texto do hero */}
          <div
            ref={nextTitleRef}
            className="invisible absolute inset-0 flex flex-col justify-end lg:justify-center"
          >
            <p className="text-xs font-bold tracking-[0.2em] text-orange uppercase sm:text-sm">
              Escolha sua próxima aventura
            </p>
            <h2 className="mt-3 font-heading text-4xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Dois mundos.{' '}
              <span className="text-cyan">Infinitas formas de se divertir.</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-mist max-lg:hidden sm:text-base">
              Não importa se você prefere construir seu próprio universo ou enfrentar um novo desafio. Seu próximo
              jogo favorito pode começar aqui.
            </p>
          </div>
        </div>
      </div>

      {/* Fase 4: cartões dos jogos, ancorados na abertura da caixa laranja */}
      <div ref={anchorRef} className="pointer-events-none absolute top-1/3 left-1/2 lg:top-1/2 lg:left-[73%]">
        <div
          ref={cardsRef}
          className="absolute top-0 left-0 flex -translate-x-1/2 -translate-y-[8%] gap-3 lg:-translate-y-[38%] lg:gap-5"
        >
          {GAMES.map((game) => (
            <article
              key={game.name}
              data-game-card
              className="pointer-events-auto invisible w-38 overflow-hidden rounded-2xl border border-white/15 bg-navy-800 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.85)] sm:w-48 lg:w-56"
            >
              <div className={`grid aspect-[4/3] place-items-center ${game.art}`}>
                <game.icon
                  aria-hidden
                  strokeWidth={1.75}
                  className="size-12 text-white drop-shadow-[0_4px_8px_rgb(0_0_0/0.35)] lg:size-16"
                />
              </div>
              <div className="p-3 lg:p-4">
                <p className="text-[10px] font-semibold tracking-wider text-mist uppercase lg:text-xs">{game.note}</p>
                <h3 className="mt-1 font-heading text-base leading-tight font-extrabold lg:text-xl">{game.name}</h3>
                <p className="mt-1 hidden text-sm text-mist sm:block">{game.tagline}</p>
                <a
                  href="#jogos"
                  aria-label={`Jogar ${game.name}`}
                  className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-orange text-sm font-bold text-navy-950 shadow-[0_3px_0_0_var(--color-ember)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-orange-soft"
                >
                  <Play aria-hidden className="size-3.5 fill-current" />
                  Jogar
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div
        data-hero="cue"
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full border border-white/15 p-2 text-mist lg:block"
      >
        <ArrowDown data-hero="cue-icon" className="size-4" />
      </div>
    </section>
  )
}
