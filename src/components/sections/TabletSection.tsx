import { useRef } from 'react'
import { ArrowRight, Sprout, Volleyball } from 'lucide-react'
import cubeSymbol from '@/assets/brand/simbolo-cubo.svg'
import { gsap, useGSAP } from '@/lib/gsap'
import { registerStops } from '@/lib/scroll-stops'
import { SCREEN_QUADS } from './tablet/screen-quads'

/**
 * Seção do tablet + jogos, numa cena fixa só:
 *
 * 1. Tablet: a câmera gira em volta do menino no sofá e mergulha na tela do tablet, onde
 *    aparece o símbolo da marca. São 360 quadros (vídeo gerado e tratado à parte) ligados
 *    ao scroll. O símbolo é HTML: uma homografia (CSS matrix3d) o encaixa nos cantos da
 *    tela rastreados em cada quadro (`SCREEN_QUADS`). No fim, a tela "assenta": vira um
 *    retângulo reto e cheio, e a cor da tela cobre tudo.
 * 2. Convite: na tela ciano, o símbolo sobe e entra a chamada para os jogos.
 * 3. Jogos (scroll horizontal): a tela ciano desliza para a esquerda e entram, lado a lado,
 *    Vida na Fazenda e Spike Rush — cada um com a sua atmosfera.
 */

const FRAME_COUNT = 360
/** Coordenadas dos cantos rastreados (vídeo original). */
const SOURCE_WIDTH = 1920
/** Painel do símbolo, na proporção da tela do tablet. */
const PANEL_WIDTH = 1690
const PANEL_HEIGHT = 1000
/** Quadros (base 0) em que a tela inclinada assenta num retângulo reto e cheio. */
const SETTLE_FROM = 329
const SETTLE_TO = 351
/** Cor da tela acesa do tablet (amostrada do vídeo). */
const SCREEN_COLOR = '#6af3f0'
/** Duração de cada etapa, em alturas de tela de scroll (a cena fica fixa o tempo todo). */
const STEPS = { frames: 3.5, invite: 1, perGame: 1.2, slide: 0.6, hold: 0.3 }

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
    icon: Sprout,
    // Fim de tarde no campo: céu claro, sol e colinas
    panel: 'bg-[linear-gradient(180deg,#bfe8ff_0%,#e6f7ff_45%,#fff4d6_100%)] text-navy-950',
    art: 'bg-[radial-gradient(circle_at_72%_26%,#fff3b0_0,#ffd25e_9%,transparent_10%),radial-gradient(ellipse_120%_60%_at_20%_100%,#3f9d4f_0,#3f9d4f_45%,transparent_46%),radial-gradient(ellipse_120%_55%_at_85%_100%,#6cc46b_0,#6cc46b_48%,transparent_49%),linear-gradient(180deg,#7dd3fc_0%,#bae6fd_60%,#fef3c7_100%)]',
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
    icon: Volleyball,
    // Quadra de praia ao entardecer: energia, sol forte e areia
    panel: 'bg-[radial-gradient(ellipse_at_70%_20%,rgb(255_138_31/0.35),transparent_55%),linear-gradient(180deg,var(--color-navy-900)_0%,#1b1440_100%)] text-snow',
    art: 'bg-[radial-gradient(circle_at_78%_22%,#fff7ed_0,#ffd08a_7%,transparent_8%),linear-gradient(180deg,#fb923c_0%,#f97316_30%,#38bdf8_30.5%,#0ea5e9_58%,#fcd34d_58.5%,#f59e0b_100%)]',
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
  const fillRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const symbolRef = useRef<HTMLImageElement>(null)
  const inviteRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const edgeRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const track = trackRef.current
      const frameEl = frameRef.current
      const canvas = canvasRef.current
      const fill = fillRef.current
      const panel = panelRef.current
      const ctx = canvas?.getContext('2d')
      if (!root || !track || !frameEl || !canvas || !fill || !panel || !ctx) return

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const frames: HTMLImageElement[] = []
      let wanted = reducedMotion ? FRAME_COUNT - 1 : 0
      let drawn = -1

      const draw = (index: number) => {
        const img = frames[index]
        if (!img?.complete || !img.naturalWidth) return
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        drawn = index
      }

      /** Encaixa o painel do símbolo na tela do tablet do quadro `index`. */
      const placePanel = (index: number) => {
        const quad = SCREEN_QUADS[index]
        if (!quad) {
          panel.style.opacity = '0'
          fill.style.opacity = '0'
          return
        }
        const scale = frameEl.clientWidth / SOURCE_WIDTH
        let corners = [0, 1, 2, 3].map((k) => [quad[k * 2] * scale, quad[k * 2 + 1] * scale])
        // Fim do mergulho: a tela inclinada vira um retângulo reto, centralizado e cheio
        const settle = smoothstep((index - SETTLE_FROM) / (SETTLE_TO - SETTLE_FROM))
        if (settle > 0) {
          const width = frameEl.clientWidth
          const height = (width * PANEL_HEIGHT) / PANEL_WIDTH
          const top = (frameEl.clientHeight - height) / 2
          const flat = [
            [0, top],
            [width, top],
            [width, top + height],
            [0, top + height],
          ]
          corners = corners.map(([x, y], k) => [x + (flat[k][0] - x) * settle, y + (flat[k][1] - y) * settle])
        }
        const source = [
          [0, 0],
          [PANEL_WIDTH, 0],
          [PANEL_WIDTH, PANEL_HEIGHT],
          [0, PANEL_HEIGHT],
        ]
        panel.style.transform = homography(source, corners)
        panel.style.opacity = String(quad[8])
        fill.style.opacity = String(settle)
      }

      const render = (index: number) => {
        wanted = index
        if (index !== drawn) draw(index)
        placePanel(index)
      }

      // Carrega os quadros só quando a seção se aproxima (são ~15 MB)
      let loading = false
      const load = () => {
        if (loading) return
        loading = true
        for (let i = 0; i < FRAME_COUNT; i++) {
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => {
            if (i === wanted) render(i)
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

      // O painel é posicionado em px do quadro: refaz ao mudar o tamanho
      const resizeObserver = new ResizeObserver(() => placePanel(wanted))
      resizeObserver.observe(frameEl)

      const cleanup = () => {
        loadObserver.disconnect()
        resizeObserver.disconnect()
        for (const img of frames) img.onload = null
      }

      if (reducedMotion) {
        // Sem a sequência: tela final com o convite; os jogos ficam empilhados (CSS)
        gsap.set([veilRef.current, edgeRef.current], { opacity: 0 })
        gsap.set(inviteRef.current, { autoAlpha: 1 })
        load()
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

      // Cena fixa: quadros do tablet → convite na tela ciano → jogos na horizontal.
      // A timeline usa "alturas de tela" como unidade de duração.
      const total = STEPS.frames + STEPS.invite + STEPS.perGame * GAMES.length + STEPS.hold
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
        snap: 'frame',
        duration: STEPS.frames,
        onUpdate: () => render(playhead.frame),
      })

      // Convite: o símbolo sobe e encolhe, a chamada entra embaixo
      const inviteAt = STEPS.frames
      scene
        .to(symbolRef.current, { yPercent: -32, scale: 0.62, duration: 0.4, ease: 'power2.inOut' }, inviteAt)
        .fromTo(
          inviteRef.current,
          { autoAlpha: 0, y: 32 },
          { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' },
          inviteAt + 0.15,
        )

      // Jogos: a trilha anda um painel por vez e para em cada jogo; o conteúdo do painel
      // entra logo atrás. A trilha tem (jogos + 1) painéis de mesma largura.
      const slideAt = inviteAt + STEPS.invite
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
            {/* Quadro 16:9: cobre a tela no desktop; no celular cabe inteiro na largura */}
            <div
              ref={frameRef}
              className="absolute top-1/2 left-1/2 aspect-video w-[min(100vw,177.78svh)] -translate-x-1/2 -translate-y-1/2 overflow-hidden lg:w-[max(100vw,177.78svh)]"
            >
              <canvas ref={canvasRef} width={1600} height={900} aria-hidden className="absolute inset-0 size-full" />
              <div ref={fillRef} aria-hidden className="absolute inset-0 opacity-0" style={{ background: SCREEN_COLOR }} />
              <div
                ref={panelRef}
                aria-hidden
                className="absolute top-0 left-0 grid origin-top-left place-items-center opacity-0 will-change-transform"
                style={{ width: PANEL_WIDTH, height: PANEL_HEIGHT }}
              >
                <img
                  ref={symbolRef}
                  src={cubeSymbol}
                  alt=""
                  className="h-auto max-h-[50%] w-[34%] object-contain drop-shadow-[0_6px_18px_rgb(0_60_70/0.25)]"
                />
              </div>
            </div>
          </div>

          {/* Convite na tela ciano, abaixo do símbolo */}
          <div
            ref={inviteRef}
            className="invisible absolute inset-x-0 bottom-[12%] px-3.5 text-center text-navy-950 lg:bottom-[14%]"
          >
            <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-70 sm:text-sm">
              Escolha sua próxima aventura
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl font-heading text-3xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Seu próximo jogo favorito pode começar aqui.
            </h2>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold opacity-75">
              Continue rolando
              <ArrowRight aria-hidden className="size-4" />
            </p>
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
              {/* Arte provisória (até chegarem imagens dos jogos) */}
              <div
                data-reveal
                aria-hidden
                className={`relative grid aspect-[16/10] place-items-center overflow-hidden rounded-3xl shadow-[0_30px_80px_-30px_rgb(0_0_0/0.55)] max-lg:max-h-[34svh] max-lg:w-full ${game.art}`}
              >
                <game.icon
                  strokeWidth={1.5}
                  className="size-20 text-white drop-shadow-[0_6px_16px_rgb(0_0_0/0.35)] sm:size-28 lg:size-36"
                />
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

function smoothstep(x: number) {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

/** CSS matrix3d da homografia que leva os 4 cantos `source` aos 4 cantos `target`. */
function homography(source: number[][], target: number[][]) {
  const a: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = source[i]
    const [u, v] = target[i]
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    b.push(u)
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    b.push(v)
  }
  const [h0, h1, h2, h3, h4, h5, h6, h7] = solve(a, b)
  return `matrix3d(${h0},${h3},0,${h6},${h1},${h4},0,${h7},0,0,1,0,${h2},${h5},0,1)`
}

/** Eliminação de Gauss com pivoteamento parcial (sistema 8×8). */
function solve(a: number[][], b: number[]) {
  const n = b.length
  for (let i = 0; i < n; i++) {
    let pivot = i
    for (let r = i + 1; r < n; r++) if (Math.abs(a[r][i]) > Math.abs(a[pivot][i])) pivot = r
    ;[a[i], a[pivot]] = [a[pivot], a[i]]
    ;[b[i], b[pivot]] = [b[pivot], b[i]]
    for (let r = i + 1; r < n; r++) {
      const f = a[r][i] / a[i][i]
      for (let c = i; c < n; c++) a[r][c] -= f * a[i][c]
      b[r] -= f * b[i]
    }
  }
  const x = new Array<number>(n)
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i]
    for (let c = i + 1; c < n; c++) s -= a[i][c] * x[c]
    x[i] = s / a[i][i]
  }
  return x
}
