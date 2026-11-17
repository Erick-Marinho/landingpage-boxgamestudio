import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import { registerStops } from '@/lib/scroll-stops'
import { GameTablet } from './tablet/GameTablet'

/**
 * Seção do tablet + jogos, numa cena fixa só:
 *
 * 1. Tablet: a câmera dá a volta no menino no sofá e se aproxima do tablet, onde ele joga
 *    Vida na Fazenda (o jogo veio gerado junto com a cena). São 193 quadros (24 fps) ligados
 *    ao scroll; entre dois quadros o canvas faz uma fusão, para o movimento não andar aos
 *    saltos. O último quadro deixa a tela do tablet nos dois terços da direita.
 * 2. Chamada: o texto entra no terço esquerdo e depois voa para dentro da tela do tablet,
 *    que acende ao recebê-lo.
 * 3. Jogos (scroll horizontal): a cena desliza para a esquerda e entram, lado a lado,
 *    Vida na Fazenda e Spike Rush — cada um com a sua atmosfera.
 */

const FRAME_COUNT = 193
/** Vídeo de origem: as coordenadas abaixo estão nessa escala. */
const SOURCE_WIDTH = 1920
const SOURCE_HEIGHT = 1080
/** Tela do tablet no último quadro (medida no vídeo de origem). */
const SCREEN = { left: 614, top: 172, right: 1840, bottom: 869 }
/**
 * Telas mais estreitas que 16:9 recortam o vídeo nas laterais. O recorte segue este ponto
 * (x no vídeo de origem): [quadro, x]. Começa entre o rosto e o tablet, acompanha o tablet
 * na volta da câmera e termina no centro da tela dele.
 */
const CROP_FOCUS: [number, number][] = [
  [0, 850],
  [24, 1000],
  [48, 1040],
  [84, 955],
  [120, 914],
  [144, 998],
  [168, 1186],
  [FRAME_COUNT - 1, (SCREEN.left + SCREEN.right) / 2],
]
/** Duração de cada etapa, em alturas de tela de scroll (a cena fica fixa o tempo todo). */
const STEPS = { frames: 3.5, text: 1.2, perGame: 1.2, slide: 0.6, hold: 0.3 }

const GAMES = [
  {
    id: 'vida-na-fazenda',
    label: 'Jogo 01 · Navegador',
    name: 'Vida na Fazenda',
    tagline: 'Um mundo que cresce com você.',
    body: [
      'Comece com um pequeno terreno. Plante suas primeiras sementes, cuide dos animais e transforme cada cantinho em algo único.',
      'Aqui, não existe pressa. Só a liberdade de criar, descobrir e ver tudo florescer do seu jeito.',
    ],
    highlights: ['Criação e personalização', 'Animais e plantações', 'Amigos e vizinhos'],
    cta: 'Construir minha fazenda',
    note: 'Grátis para jogar no navegador.',
    // Gravação do jogo (public/games): vídeo e quadro de capa
    video: 'games/vida-na-fazenda.mp4',
    poster: 'games/vida-na-fazenda.webp',
    // Fim de tarde no campo: céu claro, sol e colinas
    panel: 'bg-[linear-gradient(180deg,#bfe8ff_0%,#e6f7ff_45%,#fff4d6_100%)] text-navy-950',
    muted: 'text-navy-800/80',
    chip: 'border-navy-950/15 bg-white/60',
    button: 'bg-[#2f8f46] text-white shadow-[0_4px_0_0_#1d5e2d] hover:bg-[#37a352]',
  },
  {
    id: 'spike-rush',
    label: 'Jogo 02 · Android',
    name: 'Spike Rush',
    tagline: 'O próximo ponto é seu.',
    body: [
      'A areia é sua arena. O tempo de cada toque faz a diferença.',
      'Escolha seu personagem, domine saques e cortadas e entre no ritmo de partidas de vôlei 3 contra 3 cheias de energia. Treine suas habilidades ou desafie outros jogadores nas partidas online do aplicativo.',
    ],
    highlights: ['Vôlei 3v3', 'Personagens com habilidades únicas', 'Partidas online no app'],
    cta: 'Entrar em quadra',
    note: 'Grátis para jogar. Disponível para testes no Android.',
    video: 'games/spike-rush.mp4',
    poster: 'games/spike-rush.webp',
    // Quadra de praia ao entardecer: energia, sol forte e areia
    panel: 'bg-[radial-gradient(ellipse_at_70%_20%,rgb(255_138_31/0.35),transparent_55%),linear-gradient(180deg,var(--color-navy-900)_0%,#1b1440_100%)] text-snow',
    muted: 'text-mist',
    chip: 'border-white/15 bg-white/5',
    button: 'bg-orange text-navy-950 shadow-[0_4px_0_0_var(--color-ember)] hover:bg-orange-soft',
  },
]

const frameUrl = (index: number) => `${import.meta.env.BASE_URL}tablet/${String(index + 1).padStart(3, '0')}.webp`

export function TabletSection() {
  const rootRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const textBoxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const edgeRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const track = trackRef.current
      const frameEl = frameRef.current
      const canvas = canvasRef.current
      const textBox = textBoxRef.current
      const text = textRef.current
      const ctx = canvas?.getContext('2d')
      if (!root || !track || !frameEl || !canvas || !textBox || !text || !ctx) return

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const desktop = window.matchMedia('(min-width: 1024px)')
      const frames: HTMLImageElement[] = []
      let wanted = reducedMotion ? FRAME_COUNT - 1 : 0
      let drawn = -1

      const ready = (img?: HTMLImageElement) => !!img?.complete && !!img.naturalWidth

      /** Desenha a posição `pos` (fracionária): o quadro de baixo e, por cima, a fusão com o seguinte. */
      const draw = (pos: number) => {
        const i = Math.floor(pos)
        const mix = pos - i
        if (!ready(frames[i])) return
        ctx.globalAlpha = 1
        ctx.drawImage(frames[i], 0, 0, canvas.width, canvas.height)
        if (mix > 0.02 && ready(frames[i + 1])) {
          ctx.globalAlpha = mix
          ctx.drawImage(frames[i + 1], 0, 0, canvas.width, canvas.height)
          ctx.globalAlpha = 1
        }
        drawn = pos
      }

      /**
       * Deslocamento (translate x, em px) do quadro para o recorte acompanhar o tablet: quando
       * o quadro é mais largo que a tela, o ponto de interesse vai para o centro, sem nunca
       * mostrar além da borda do vídeo. `null` quando o quadro cabe inteiro.
       */
      const cropX = (pos: number) => {
        const frameWidth = frameEl.clientWidth
        const viewWidth = frameEl.parentElement?.clientWidth ?? frameWidth
        if (frameWidth - viewWidth < 1) return null
        const focus = interpolate(CROP_FOCUS, pos)
        return Math.min(-viewWidth / 2, Math.max(viewWidth / 2 - frameWidth, (-focus * frameWidth) / SOURCE_WIDTH))
      }

      const followCrop = (pos: number) => {
        const x = cropX(pos)
        frameEl.style.translate = x === null ? '' : `${x}px -50%`
      }

      /** Retângulo da tela do tablet no último quadro, em px do painel da cena. */
      const screenBox = () => {
        const frameWidth = frameEl.clientWidth
        const frameHeight = frameEl.clientHeight
        const view = frameEl.parentElement
        const viewWidth = view?.clientWidth ?? frameWidth
        const viewHeight = view?.clientHeight ?? frameHeight
        const left = viewWidth / 2 + (cropX(FRAME_COUNT - 1) ?? -frameWidth / 2)
        const top = (viewHeight - frameHeight) / 2
        const k = frameWidth / SOURCE_WIDTH
        return {
          left: left + SCREEN.left * k,
          top: top + SCREEN.top * k,
          width: (SCREEN.right - SCREEN.left) * k,
          height: (SCREEN.bottom - SCREEN.top) * k,
        }
      }

      /** No computador, o texto ocupa a faixa à esquerda da tela do tablet. */
      const layoutText = () => {
        textBox.style.width = desktop.matches ? `${Math.max(320, screenBox().left - 24)}px` : ''
      }

      const render = (pos: number) => {
        wanted = pos
        if (pos !== drawn) draw(pos)
        followCrop(pos)
      }

      // Carrega os quadros só quando a seção se aproxima (são ~12 MB)
      let loading = false
      const load = () => {
        if (loading) return
        loading = true
        for (let i = 0; i < FRAME_COUNT; i++) {
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => {
            if (Math.floor(wanted) === i || Math.ceil(wanted) === i) render(wanted)
          }
          img.src = frameUrl(i)
          frames[i] = img
        }
      }
      const loadObserver = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          load()
          loadObserver.disconnect()
        },
        { rootMargin: '150% 0px' },
      )
      loadObserver.observe(root)

      // Recorte e faixa do texto dependem do tamanho do quadro: refaz ao mudar
      const resizeObserver = new ResizeObserver(() => {
        followCrop(wanted)
        layoutText()
      })
      resizeObserver.observe(frameEl)

      const cleanup = () => {
        loadObserver.disconnect()
        resizeObserver.disconnect()
        for (const img of frames) img.onload = null
      }

      if (reducedMotion) {
        // Sem a sequência: último quadro com o texto ao lado; os jogos ficam empilhados (CSS)
        gsap.set([veilRef.current, edgeRef.current], { opacity: 0 })
        gsap.set([...text.children, shadeRef.current], { autoAlpha: 1 })
        load()
        layoutText()
        render(FRAME_COUNT - 1)
        // Sem cena fixa, cada parada é a posição do próprio painel na página
        const pageY = (id: string) => (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + window.scrollY
        const unregisterStops = registerStops([
          { id: 'jogos', label: 'Jogos', order: 10, getY: () => pageY('jogos') },
          ...GAMES.map((game, i) => ({ id: game.id, label: game.name, order: 11 + i, getY: () => pageY(game.id) })),
        ])
        return () => {
          unregisterStops()
          cleanup()
        }
      }

      // Entrada: o azul-noite do hero continua por cima da sala e se desfaz enquanto a
      // seção sobe, como se a luz acendesse. A faixa do topo (mesma cor do pé do hero)
      // evita emenda; o vídeo chega levemente ampliado e assenta.
      gsap
        .timeline({ scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: true } })
        .fromTo(veilRef.current, { opacity: 0.5 }, { opacity: 0, ease: 'power1.out', duration: 0.75 }, 0)
        .fromTo(edgeRef.current, { opacity: 1 }, { opacity: 0, ease: 'power1.in', duration: 0.45 }, 0.35)
        .fromTo(zoomRef.current, { scale: 1.08 }, { scale: 1, ease: 'none', duration: 1 }, 0)

      // Cena fixa: quadros do tablet → texto voando para a tela → jogos na horizontal.
      // A timeline usa "alturas de tela" como unidade de duração.
      const total = STEPS.frames + STEPS.text + STEPS.perGame * GAMES.length + STEPS.hold
      const playhead = { frame: 0 }
      const scene = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${window.innerHeight * total}`,
          pin: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      })
      scene.to(playhead, {
        frame: FRAME_COUNT - 1,
        duration: STEPS.frames,
        // Um pouco de folga: posições fracionárias a menos de 1% de distância não redesenham
        onUpdate: () => render(Math.round(playhead.frame * 100) / 100),
      })

      // Chamada: entra no terço esquerdo enquanto a câmera chega no tablet...
      const textAt = STEPS.frames - 0.35
      scene
        .fromTo(shadeRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, textAt)
        .fromTo(
          text.children,
          { autoAlpha: 0, x: -60 },
          { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' },
          textAt,
        )

      // ...e voa para dentro da tela do tablet, que acende ao recebê-lo.
      // O destino é calculado do layout (sem transform), e refeito a cada refresh.
      const flyAt = STEPS.frames + 0.45
      const flyTarget = () => {
        const screen = screenBox()
        return {
          x: screen.left + screen.width / 2 - (textBox.offsetLeft + text.offsetLeft + text.offsetWidth / 2),
          y: screen.top + screen.height / 2 - (textBox.offsetTop + text.offsetTop + text.offsetHeight / 2),
        }
      }
      scene
        .to(
          text,
          {
            x: () => flyTarget().x,
            y: () => flyTarget().y,
            scale: 0.08,
            autoAlpha: 0,
            duration: 0.5,
            ease: 'power3.in',
            immediateRender: false,
          },
          flyAt,
        )
        .to(shadeRef.current, { autoAlpha: 0, duration: 0.4 }, flyAt + 0.1)
        .fromTo(screenRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'power1.in' }, flyAt + 0.42)
        .to(screenRef.current, { autoAlpha: 0, duration: 0.35, ease: 'power1.out' }, flyAt + 0.54)

      // Jogos: a trilha anda um painel por vez e para em cada jogo; o conteúdo do painel
      // entra logo atrás. A trilha tem (jogos + 1) painéis de mesma largura.
      const slideAt = STEPS.frames + STEPS.text
      const panels = GAMES.length + 1
      gsap.utils.toArray<HTMLElement>('[data-game-panel]').forEach((gamePanel, i) => {
        const at = slideAt + i * STEPS.perGame
        scene
          .to(track, { xPercent: (-100 / panels) * (i + 1), duration: STEPS.slide, ease: 'power2.inOut' }, at)
          .from(
            gamePanel.querySelectorAll('[data-reveal]'),
            { x: 140, autoAlpha: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out' },
            at + STEPS.slide * 0.55,
          )
          // Ponto da navegação lateral: painel parado e conteúdo já à mostra
          .addLabel(GAMES[i].id, at + STEPS.slide + 0.3)
      })

      // Pausa no último jogo e duração fechada em `total`: 1 unidade = 1 altura de tela
      scene.set({}, {}, total)

      // Paradas da navegação lateral: o começo da cena (menino) e cada jogo
      const unregisterStops = registerStops([
        { id: 'jogos', label: 'Jogos', order: 10, getY: () => scene.scrollTrigger?.start ?? 0 },
        ...GAMES.map((game, i) => ({
          id: game.id,
          label: game.name,
          order: 11 + i,
          getY: () => scene.scrollTrigger?.labelToScroll(game.id) ?? 0,
        })),
      ])

      render(0)
      layoutText()
      return () => {
        unregisterStops()
        cleanup()
      }
    },
    { scope: rootRef },
  )

  return (
    <section
      id="jogos"
      ref={rootRef}
      aria-label="Nossos jogos"
      className="relative h-svh overflow-hidden bg-navy-950 motion-reduce:h-auto"
    >
      {/* Trilha com 3 painéis (tablet + 2 jogos), cada um com 1/3 da trilha = largura da seção */}
      <div ref={trackRef} className="flex h-full w-[300%] motion-reduce:w-full motion-reduce:flex-col">
        {/* Painel 1: o menino, o tablet e o convite */}
        <div className="relative h-svh w-1/3 shrink-0 overflow-hidden motion-reduce:w-full">
          {/* Zoom de entrada num invólucro próprio: o GSAP não mexe no centralizado do quadro */}
          <div ref={zoomRef} className="absolute inset-0">
            {/* Quadro 16:9 cobrindo a tela; em telas estreitas o recorte segue o tablet (followCrop) */}
            <div
              ref={frameRef}
              className="absolute top-1/2 left-1/2 aspect-video w-[max(100vw,177.78svh)] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
            >
              <canvas ref={canvasRef} width={1600} height={900} aria-hidden className="absolute inset-0 size-full" />
              {/* Luz da tela do tablet no último quadro: acende quando o texto entra nela */}
              <div
                ref={screenRef}
                aria-hidden
                className="invisible absolute rounded-[2%] bg-[radial-gradient(ellipse_at_center,rgb(255_255_255/0.85),rgb(214_255_200/0.45)_55%,rgb(214_255_200/0)_100%)] mix-blend-screen"
                style={{
                  left: `${(SCREEN.left / SOURCE_WIDTH) * 100}%`,
                  top: `${(SCREEN.top / SOURCE_HEIGHT) * 100}%`,
                  width: `${((SCREEN.right - SCREEN.left) / SOURCE_WIDTH) * 100}%`,
                  height: `${((SCREEN.bottom - SCREEN.top) / SOURCE_HEIGHT) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Sombra para ler o texto: da esquerda no computador, de baixo no celular */}
          <div
            ref={shadeRef}
            aria-hidden
            className="pointer-events-none invisible absolute inset-0 bg-linear-to-t from-navy-950/85 via-navy-950/30 via-45% to-transparent to-70% lg:bg-linear-to-r lg:from-navy-950/75 lg:via-navy-950/25 lg:via-35% lg:to-55%"
          />

          {/* Chamada: no terço esquerdo (largura ajustada à tela do tablet); embaixo no celular */}
          <div
            ref={textBoxRef}
            className="absolute inset-x-0 bottom-[8%] px-3.5 text-center text-snow lg:inset-y-0 lg:right-auto lg:flex lg:items-center lg:px-4.5 lg:text-left"
          >
            <div ref={textRef} className="lg:pr-2">
              <p className="invisible text-xs font-bold tracking-[0.2em] text-orange uppercase sm:text-sm">
                Escolha sua próxima aventura
              </p>
              <h2 className="invisible mx-auto mt-3 max-w-xl font-heading text-3xl leading-[1.02] font-extrabold tracking-tight text-balance drop-shadow-[0_4px_24px_rgb(0_0_0/0.35)] sm:text-5xl lg:mx-0 lg:text-4xl xl:text-5xl">
                Seu próximo jogo favorito pode começar aqui.
              </h2>
              <p className="invisible mt-4 inline-flex items-center gap-2 text-sm font-semibold text-snow/80">
                Continue rolando
                <ArrowRight aria-hidden className="size-4" />
              </p>
            </div>
          </div>

          {/* Entrada: escurece a sala e, no topo, continua o pé do hero (navy-900) sem emenda */}
          <div ref={veilRef} aria-hidden className="pointer-events-none absolute inset-0 bg-navy-900" />
          <div
            ref={edgeRef}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-linear-to-b from-navy-900 from-10% to-transparent"
          />
        </div>

        {/* Painéis dos jogos */}
        {GAMES.map((game) => (
          <article
            key={game.id}
            id={game.id}
            data-game-panel
            aria-labelledby={`${game.id}-title`}
            className={`relative flex h-svh w-1/3 shrink-0 items-center overflow-hidden px-3.5 pt-20 pb-8 motion-reduce:w-full lg:px-4.5 lg:pt-24 ${game.panel}`}
          >
            <div className="mx-auto grid w-full max-w-[1600px] items-center gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
              {/* O jogo rodando num tablet */}
              <div data-reveal className="mx-auto w-full max-lg:max-w-[min(100%,68svh)]">
                <GameTablet video={game.video} poster={game.poster} title={game.name} />
              </div>

              <div>
                <p data-reveal className={`text-xs font-bold tracking-[0.2em] uppercase sm:text-sm ${game.muted}`}>
                  {game.label}
                </p>
                <h3
                  data-reveal
                  id={`${game.id}-title`}
                  className="mt-2 font-heading text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-5xl lg:text-7xl"
                >
                  {game.name}
                </h3>
                <p data-reveal className="mt-3 font-heading text-xl font-bold sm:text-2xl">
                  {game.tagline}
                </p>
                <div data-reveal className={`mt-4 max-w-xl space-y-3 text-sm leading-relaxed sm:text-base ${game.muted}`}>
                  {game.body.map((paragraph, k) => (
                    <p key={k} className={k > 0 ? 'max-lg:hidden' : undefined}>
                      {paragraph}
                    </p>
                  ))}
                </div>
                <ul data-reveal className="mt-5 flex flex-wrap gap-2">
                  {game.highlights.map((item) => (
                    <li key={item} className={`rounded-full border px-3 py-1 text-xs font-semibold sm:text-sm ${game.chip}`}>
                      {item}
                    </li>
                  ))}
                </ul>
                <div data-reveal className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <a
                    href={`#${game.id}`}
                    className={`inline-flex h-12 items-center gap-2 rounded-xl px-6 text-base font-bold transition-[transform,background-color] hover:-translate-y-0.5 ${game.button}`}
                  >
                    {game.cta}
                    <ArrowRight aria-hidden className="size-4" />
                  </a>
                  <p className={`text-sm ${game.muted}`}>{game.note}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/** Interpolação linear numa lista de pares [x, y] ordenada por x. */
function interpolate(points: [number, number][], x: number) {
  if (x <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]
    if (x <= x1) {
      const [x0, y0] = points[i - 1]
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    }
  }
  return points[points.length - 1][1]
}
