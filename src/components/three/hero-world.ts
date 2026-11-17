import * as THREE from 'three'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { gsap } from '@/lib/gsap'

/**
 * Cena do hero: o cubo da marca Box Game Studio (2×2×2) em 3D.
 *
 * - Visual fiel ao símbolo: contorno grosso escuro e cor de cada face definida
 *   pela direção para onde ela aponta (topo claro, frente azul, lateral escura).
 * - Entrada: os cubinhos se montam, a camada de cima gira e o cubo "se abre"
 *   liberando luz e partículas — "Um universo inteiro."
 * - Repouso: gira devagar e faz um giro de camada que depois se desfaz, como um puzzle.
 * - Jogável: arrastar um bloco gira a camada dele (encaixa a cada 90°); arrastar perto
 *   do cubo (mouse) gira o cubo inteiro; tocar num bloco dispara um giro com explosão.
 *   Levar a caixinha laranja de volta ao canto dela comemora com luz.
 * - Ao começar a rolar, o cubo se resolve sozinho desfazendo as jogadas, e só então destrava.
 * - Abertura por scroll, fase 1 ("destravar"): `setUnlock(0..1)` para o balanço e
 *   os giros, leva o cubo a uma pose de ¾, engrossa o contorno e solta as caixinhas
 *   com um "clique" de luz.
 * - Fase 2 ("abrir"): `setOpen(0..1)` afasta as caixinhas azuis para os cantos, girando e
 *   em sequência, enquanto a laranja vai para o centro e se acende.
 * - Fase 3 ("presente"): `setReveal(0..1)` apaga as azuis ao fundo; a laranja vira de frente,
 *   cresce e a tampa salta, soltando luz de dentro.
 * - Fase 4 (os jogos): os cartões são HTML no Hero; `getAnchor()` diz onde fica a abertura
 *   da caixa na tela para eles saírem de lá.
 * - Scroll: `setScroll(0..1)` desmonta o cubo conforme o hero sai da tela.
 *
 * O módulo não depende de React: devolve a timeline de entrada (para o Hero
 * sincronizar com o texto), o controle de scroll e uma função de limpeza.
 */

const PALETTE = {
  outline: 0x050b17,
  inner: 0x0e2a55,
  glow: 0x9fe6ff,
  blue: { top: 0x52d3ff, front: 0x049fdf, side: 0x035db4, bottom: 0x00418c },
  orange: { top: 0xffa24d, front: 0xff8a1f, side: 0xcf4f00, bottom: 0x8f3600 },
}

/** Momento (s, relativo à timeline de entrada) em que o cubo se abre. */
export const HERO_WORLD_REVEAL_AT = 1.75

const CAMERA_DISTANCE = 9
const CAMERA_HEIGHT = 2.6
const CAMERA_TARGET = new THREE.Vector3(0, 0, 0)
/** Espaço (em unidades da cena) que o cubo ocupa, já contando a abertura. */
const WORLD_SIZE = 4.4
/** Mesmo breakpoint do Tailwind `lg`: abaixo disso a cena fica no topo. */
const DESKTOP_MIN_WIDTH = 1024
/** Altura do cabeçalho no mobile (h-16). */
const MOBILE_HEADER_PX = 64
/** Ângulo de repouso: uma quina voltada para a câmera, como no símbolo. */
const REST_YAW = 0.72
/** Cubinho laranja (coordenadas lógicas ±1), como no símbolo: topo, atrás, à esquerda. */
const ORANGE_SLOT = new THREE.Vector3(-1, 1, -1)
/** Fase 1 ("destravar"): pose de vitrine em ¾, com um pouco mais de topo à mostra. */
const UNLOCK_YAW = REST_YAW
const UNLOCK_PITCH = 0.2
/** Quanto o contorno engrossa ao destravar (multiplicador). */
const UNLOCK_LINE_BOOST = 0.55
/** Folga entre as caixinhas no "clique" final do destrave. */
const UNLOCK_GAP = 0.07
/** Fase 2 ("abrir"): quanto cada caixinha azul se afasta na direção do seu canto. */
const OPEN_DISTANCE = 1.12
/** Atraso máximo entre as caixinhas (fração da fase), para a explosão sair escalonada. */
const OPEN_STAGGER = 0.3
/** Giro máximo (rad) de cada caixinha enquanto se afasta. */
const OPEN_SPIN = 0.55
/** A caixinha laranja cresce um pouco ao chegar ao centro. */
const OPEN_ORANGE_SCALE = 0.14
/** Quanto a laranja avança do centro em direção à câmera (fica à frente das azuis de trás). */
const OPEN_ORANGE_FORWARD = 0.9
/**
 * Pose ao abrir: quase de frente. Na pose ¾ uma quina aponta para a câmera e a caixinha
 * dessa quina, ao se afastar, continuaria na frente do centro; de frente, elas se abrem
 * para os lados na tela e a laranja aparece no meio.
 */
/** Ao abrir, a cena recua um pouco para as caixinhas afastadas caberem na tela. */
const OPEN_ZOOM_OUT = 0.28
const OPEN_YAW = 0.18
const OPEN_PITCH = 0.08
/** Fase 3 ("presente"): as azuis recuam mais e escurecem, viram pano de fundo. */
const REVEAL_DISTANCE = 0.9
/** …e também recuam para longe da câmera, ficando atrás da laranja. */
const REVEAL_BACK = 2
const REVEAL_DIM = 0.78
/** A laranja vira de frente para a câmera, avança e cresce até esta escala. */
const REVEAL_ORANGE_FORWARD = 1.5
const REVEAL_ORANGE_SCALE = 1.8
/** Inclinação para a tampa ficar à mostra (rad). */
const REVEAL_TILT = 0.68
/** A tampa "pula": sobe, recua um pouco e inclina para trás (rad), flutuando sobre a caixa. */
const REVEAL_LID_LIFT = 0.7
const REVEAL_LID_BACK = 0.3
const REVEAL_LID_ANGLE = 0.55

type Axis = 'x' | 'y' | 'z'
const AXES: Record<Axis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
}
/** Normais locais na ordem dos grupos de material da BoxGeometry (+x, −x, +y, −y, +z, −z). */
const FACE_NORMALS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
]

/** Uma jogada: `turns` quartos de volta (±1 ou 2) na camada `layer` do eixo. */
type Move = { axis: Axis; layer: number; turns: number; source: 'auto' | 'user' }

export type HeroWorld = {
  intro: gsap.core.Timeline
  /** Progresso do scroll de saída do hero (0 = topo, 1 = hero fora da tela). */
  setScroll: (progress: number) => void
  /** Fase 1 da abertura por scroll: 0 = cubo livre (repouso), 1 = destravado. */
  setUnlock: (progress: number) => void
  /** Fase 2: 0 = cubo fechado, 1 = caixinhas afastadas e a laranja brilhando no centro. */
  setOpen: (progress: number) => void
  /** Fase 3: 0 = laranja no centro, 1 = de frente, grande e com a tampa aberta. */
  setReveal: (progress: number) => void
  /** Fase 4: posição (px, relativa ao contêiner da cena) da abertura da caixa laranja. */
  getAnchor: () => { x: number; y: number }
  render: () => void
  dispose: () => void
}

type Options = {
  reducedMotion: boolean
  /** Bloco de texto do hero: no mobile a cena ocupa o espaço livre acima dele. */
  textElement?: HTMLElement | null
}

type Cubelet = {
  /** Posição lógica no cubo (cada eixo é −1 ou +1). */
  slot: THREE.Vector3
  /** Orientação acumulada pelos giros de camada. */
  quat: THREE.Quaternion
  /** Progresso da montagem (0 = fora, 1 = encaixado). */
  t: number
  startPos: THREE.Vector3
  startQuat: THREE.Quaternion
  group: THREE.Group
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.Material[]>
  skin: THREE.Material
  /** Fase 2: atraso da saída (0..OPEN_STAGGER), eixo e ângulo do giro ao se afastar. */
  openDelay: number
  openAxis: THREE.Vector3
  openSpin: number
}

export function createHeroWorld(container: HTMLElement, { reducedMotion, textElement }: Options): HeroWorld | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  } catch {
    // Sem WebGL: o hero continua funcionando só com o fundo em CSS.
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  const canvas = renderer.domElement
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y'
  container.appendChild(canvas)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE)
  camera.lookAt(CAMERA_TARGET)

  const rand = mulberry32(2013)
  const glowTexture = radialTexture([
    [0, 'rgba(235,250,255,1)'],
    [0.25, 'rgba(120,220,255,0.55)'],
    [1, 'rgba(40,140,255,0)'],
  ])
  const shadowTexture = radialTexture([
    [0, 'rgba(2,5,12,0.95)'],
    [1, 'rgba(2,5,12,0)'],
  ])
  const dotTexture = radialTexture([
    [0, 'rgba(255,255,255,1)'],
    [0.45, 'rgba(255,255,255,0.7)'],
    [1, 'rgba(255,255,255,0)'],
  ])

  const stars = makeStars(rand, dotTexture)
  scene.add(stars)

  // O stage é posicionado/escalado pelo layout; o cubeRoot gira.
  const stage = new THREE.Group()
  scene.add(stage)
  const cubeRoot = new THREE.Group()
  stage.add(cubeRoot)

  // Materiais
  const blueSkin = skinMaterial(PALETTE.blue)
  const orangeSkin = skinMaterial(PALETTE.orange)
  const innerMaterial = new THREE.MeshBasicMaterial({
    color: PALETTE.inner,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
  // Espessura em pixels (ajustada no layout): estável em qualquer ângulo
  const lineMaterial = new LineMaterial({ color: PALETTE.outline, linewidth: 4 })
  /** Fase 2: a laranja saiu do canto e mostra a cor em todas as faces. */
  let orangeAllSkin = false
  /** Fase 3: com a tampa aberta, o topo da laranja vira o interior aceso. */
  let orangeLidOpen = false
  const interiorMaterial = new THREE.MeshBasicMaterial({ color: 0xffe9c2 })
  const orangeClosedFaces = Array<THREE.Material>(6).fill(orangeSkin)
  // Ordem dos grupos da BoxGeometry: +x, −x, +y (topo), −y, +z, −z
  const orangeOpenFaces = orangeClosedFaces.map((m, i) => (i === 2 ? interiorMaterial : m))

  // Cubinhos
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
  const edgeGeometry = new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(boxGeometry))
  const cubelets: Cubelet[] = []
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        const slot = new THREE.Vector3(x, y, z)
        const group = new THREE.Group()
        const skin = slot.equals(ORANGE_SLOT) ? orangeSkin : blueSkin
        const mesh = new THREE.Mesh(boxGeometry, Array<THREE.Material>(6).fill(skin))
        group.add(mesh, new LineSegments2(edgeGeometry, lineMaterial))
        cubeRoot.add(group)

        const direction = new THREE.Vector3(rand() - 0.5, rand() - 0.3, rand() - 0.5).normalize()
        const cubelet: Cubelet = {
          slot,
          quat: new THREE.Quaternion(),
          t: 0,
          startPos: direction.multiplyScalar(5 + rand() * 2.5),
          startQuat: new THREE.Quaternion().setFromEuler(
            new THREE.Euler(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2),
          ),
          group,
          mesh,
          skin,
          openDelay: rand() * OPEN_STAGGER,
          openAxis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
          openSpin: OPEN_SPIN * (0.5 + rand() * 0.5) * (rand() < 0.5 ? -1 : 1),
        }
        updateFaces(cubelet)
        cubelets.push(cubelet)
      }
    }
  }

  // Luz interna (aparece quando o cubo se abre)
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: PALETTE.glow,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
  const glow = new THREE.Sprite(glowMaterial)
  /** Brilho próprio da caixinha laranja (fase 2). */
  const orangeGlow = (orangeSkin as THREE.ShaderMaterial).uniforms.uGlow
  glow.scale.setScalar(0)
  cubeRoot.add(glow)

  // Sombra projetada
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0 })
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), shadowMaterial)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -1.85
  stage.add(shadow)

  // Partículas da explosão
  const particles = makeParticles(rand, dotTexture)
  stage.add(particles.points)

  // Estado animado pela timeline e lido a cada quadro
  const state = { spread: 0, glow: 0, burst: 0, idle: 0, scroll: 0, unlock: 0, open: 0, reveal: 0 }
  let smoothReveal = 0
  let smoothScroll = 0
  let smoothUnlock = 0
  let smoothOpen = 0
  /** Espessura do contorno calculada no layout (antes do reforço do destrave). */
  let baseLineWidth = 4
  /** Aresta do cubo na tela (px), para a área de arrasto em volta dele. */
  let cubeScreenPx = 200
  /** Escala do stage calculada no layout (antes do recuo da fase 2). */
  let baseStageScale = 1
  const twist = { axis: 'y' as Axis, layer: 1, angle: 0, active: false }
  const rotation = { yaw: 0, pitch: 0, vYaw: 0 }
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
  /**
   * Arrasto. `pending`: tocou num bloco e ainda não se sabe a direção;
   * `twist`: girando uma camada; `orbit`: girando o cubo inteiro.
   */
  const drag = {
    active: false,
    id: -1,
    mode: 'pending' as 'pending' | 'twist' | 'orbit',
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    moved: false,
    cubelet: null as Cubelet | null,
    /** Ponto tocado, em coordenadas do cubeRoot. */
    point: new THREE.Vector3(),
    normalAxis: 'y' as Axis,
    /** Quanto o ponto tocado anda na tela (px) por radiano de giro da camada. */
    tangent: new THREE.Vector2(),
    velocity: 0,
  }
  const orangeCubelet = cubelets.find((c) => c.skin === orangeSkin) ?? cubelets[0]

  // Fase 3: tampa de caixa de presente, presa pela aresta de trás do topo da laranja
  const lidGeometry = new THREE.BoxGeometry(1.08, 0.14, 1.08)
  // A face de baixo da tampa (−y) fica clara: iluminada pela luz de dentro ao abrir
  const lidInsideMaterial = new THREE.MeshBasicMaterial({ color: 0xffc98a })
  const lid = new THREE.Mesh(
    lidGeometry,
    Array<THREE.Material>(6)
      .fill(orangeSkin)
      .map((m, i) => (i === 3 ? lidInsideMaterial : m)),
  )
  lid.position.set(0, 0.07, 0.54)
  lid.add(new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(lidGeometry)), lineMaterial))
  const lidPivot = new THREE.Group()
  lidPivot.position.set(0, 0.5, -0.54)
  lidPivot.visible = false
  lidPivot.add(lid)
  orangeCubelet.group.add(lidPivot)
  const lidEase = gsap.parseEase('back.out(1.5)')
  // Luz que sai de dentro da caixa aberta
  const beam = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffd9a0,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  )
  beam.position.set(0, 0.75, 0)
  beam.visible = false
  orangeCubelet.group.add(beam)
  const blueDim = (blueSkin as THREE.ShaderMaterial).uniforms.uDim

  /* ---------------- Giros de camada ---------------- */

  let twistTween: gsap.core.Tween | null = null
  let nextTwist: gsap.core.Tween | null = null
  /** Jogadas desde o cubo montado; desfeitas (de trás para frente) ao resolver. */
  const history: Move[] = []
  let solving = false
  /** O visitante tirou a caixinha laranja do lugar (para comemorar quando ela voltar). */
  let scrambled = false
  /** Chamado quando o giro em andamento termina. */
  let afterTwist: (() => void) | null = null

  type TwistOptions = { duration?: number; ease?: string; record?: Move['source']; onDone?: () => void }

  function startTwist(
    axis: Axis,
    layer: number,
    turns: number,
    { duration = 0.7, ease = 'back.inOut(1.4)', record, onDone }: TwistOptions = {},
  ) {
    if (twist.active) return false
    Object.assign(twist, { axis, layer, angle: 0, active: true })
    tweenTwistTo(turns, duration, ease, record, onDone)
    return true
  }

  /** Leva o giro atual até `turns` quartos de volta, encaixa e registra a jogada. */
  function tweenTwistTo(turns: number, duration: number, ease: string, record?: Move['source'], onDone?: () => void) {
    twistTween?.kill()
    twistTween = gsap.to(twist, {
      angle: (turns * Math.PI) / 2,
      duration,
      ease,
      onComplete: () => {
        twistTween = null
        const { axis, layer } = twist
        bakeTwist()
        if (record && turns % 4 !== 0) recordMove({ axis, layer, turns, source: record })
        onDone?.()
        const next = afterTwist
        afterTwist = null
        next?.()
      },
    })
  }

  function recordMove(move: Move) {
    const last = history[history.length - 1]
    if (last && last.axis === move.axis && last.layer === move.layer && last.source === move.source) {
      // Giros seguidos na mesma camada viram uma jogada só (ou se anulam)
      last.turns = normalizeTurns(last.turns + move.turns)
      if (last.turns === 0) history.pop()
    } else {
      history.push(move)
    }
    if (move.source === 'user') checkSolved()
  }

  /** Só a caixinha laranja se distingue: o puzzle é levá-la de volta ao canto dela. */
  function checkSolved() {
    if (!orangeCubelet.slot.equals(ORANGE_SLOT)) {
      scrambled = true
      return
    }
    if (!scrambled) return
    scrambled = false
    history.length = 0
    celebrate()
  }

  function celebrate() {
    gsap.fromTo(state, { burst: 0 }, { burst: 1, duration: 1.6, ease: 'power2.out', overwrite: 'auto' })
    gsap.fromTo(state, { glow: 3.4 }, { glow: 1.2, duration: 1.3, ease: 'power2.out', overwrite: 'auto' })
    gsap.to(state, { spread: 0.3, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1 })
  }

  /** Resolve o cubo desfazendo as jogadas, rápido, antes do destrave. */
  function solve() {
    if (solving) return
    if (drag.active) {
      if (drag.mode === 'twist') releaseTwist()
      drag.active = false
      canvas.style.cursor = ''
    }
    if (twist.active) {
      afterTwist = solve
      return
    }
    if (!history.length) return
    solving = true
    const duration = THREE.MathUtils.clamp(1.8 / history.length, 0.14, 0.32)
    const step = () => {
      const move = history.pop()
      if (!move) {
        solving = false
        scrambled = false
        return
      }
      startTwist(move.axis, move.layer, -move.turns, { duration, ease: 'power2.inOut', onDone: step })
    }
    step()
  }

  function bakeTwist() {
    const q = new THREE.Quaternion().setFromAxisAngle(AXES[twist.axis], twist.angle)
    for (const c of cubelets) {
      if (c.slot[twist.axis] !== twist.layer) continue
      c.slot.applyQuaternion(q).round()
      c.quat.premultiply(q).normalize()
      updateFaces(c)
    }
    twist.active = false
    twist.angle = 0
  }

  function randomTwist(record: Move['source']) {
    const axes: Axis[] = ['x', 'y', 'z']
    startTwist(axes[Math.floor(rand() * 3)], rand() < 0.5 ? -1 : 1, rand() < 0.5 ? -1 : 1, { record })
  }

  /** Repouso: um giro e, no próximo, o desfaz — sem estragar o que o visitante montou. */
  function idleTwist() {
    const last = history[history.length - 1]
    if (!last) randomTwist('auto')
    else if (last.source === 'auto' && startTwist(last.axis, last.layer, -last.turns)) history.pop()
    // Se a última jogada foi do visitante, o cubo espera ele (ou o scroll) resolver
  }

  function scheduleTwists() {
    nextTwist = gsap.delayedCall(2.6 + rand() * 1.8, () => {
      // Nada de giros automáticos durante o jogo nem depois que a abertura começou
      if (canInteract() && !drag.active) idleTwist()
      scheduleTwists()
    })
  }

  /** Toque num bloco: giro + explosão curta. */
  function play() {
    randomTwist('user')
    gsap.fromTo(state, { burst: 0 }, { burst: 1, duration: 1.4, ease: 'power2.out', overwrite: 'auto' })
    gsap.fromTo(state, { glow: 3 }, { glow: 1.2, duration: 1.1, ease: 'power2.out', overwrite: 'auto' })
    gsap.to(state, { spread: 0.24, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 })
  }

  /* ---------------- Atualização por quadro ---------------- */

  const tmpPos = new THREE.Vector3()
  const tmpQuat = new THREE.Quaternion()
  const twistQuat = new THREE.Quaternion()
  const openQuat = new THREE.Quaternion()
  const tmpDir = new THREE.Vector3()
  const cameraLocal = new THREE.Vector3(0, 0, 1)
  const upLocal = new THREE.Vector3()
  const lookMatrix = new THREE.Matrix4()
  const revealQuat = new THREE.Quaternion()
  const tiltQuat = new THREE.Quaternion().setFromAxisAngle(AXES.x, REVEAL_TILT)
  const zero = new THREE.Vector3()
  const glowBlue = new THREE.Color(PALETTE.glow)
  const glowOrange = new THREE.Color(PALETTE.orange.top)

  function updateCubelets() {
    // "Clique" do destrave: as caixinhas se soltam um pouco só no fim da fase 1
    const unlockGap = UNLOCK_GAP * smoothstep(0.7, 1, smoothUnlock)
    const spacing = 0.5 + state.spread + unlockGap + smoothScroll * 0.9
    if (twist.active) twistQuat.setFromAxisAngle(AXES[twist.axis], twist.angle)
    const r = smoothReveal
    if (smoothOpen > 0) {
      // Direção da câmera no espaço do cubo (para a laranja avançar na direção certa)
      cubeRoot.updateMatrixWorld()
      cubeRoot.worldToLocal(cameraLocal.copy(camera.position)).normalize()
    }
    if (r > 0) {
      // Orientação "de frente para a câmera", com o topo um pouco à mostra
      upLocal.set(0, 1, 0).applyQuaternion(tmpQuat.copy(cubeRoot.quaternion).invert())
      lookMatrix.lookAt(cameraLocal, zero, upLocal)
      revealQuat.setFromRotationMatrix(lookMatrix).multiply(tiltQuat)
    }
    for (const c of cubelets) {
      tmpPos.copy(c.slot).multiplyScalar(spacing)
      tmpQuat.copy(c.quat)
      if (twist.active && c.slot[twist.axis] === twist.layer) {
        tmpPos.applyQuaternion(twistQuat)
        tmpQuat.premultiply(twistQuat)
      }
      // Fase 2: as azuis saem para os cantos girando; a laranja vai para o centro
      if (c === orangeCubelet) {
        const o = smoothstep(0, 1, smoothOpen)
        // Fora do canto, as faces que eram internas também ficam laranja (ela é a estrela)
        const showAll = smoothOpen > 0.2
        if (showAll !== orangeAllSkin) {
          orangeAllSkin = showAll
          updateFaces(c)
        }
        if (o > 0) tmpPos.lerp(tmpDir.copy(cameraLocal).multiplyScalar(OPEN_ORANGE_FORWARD), o)
        // Fase 3: vira de frente, avança e cresce
        const grow = smoothstep(0.05, 0.6, r)
        if (r > 0) {
          tmpPos.lerp(tmpDir.copy(cameraLocal).multiplyScalar(REVEAL_ORANGE_FORWARD), grow)
          tmpQuat.slerp(revealQuat, smoothstep(0, 0.5, r))
        }
        c.group.scale.setScalar(THREE.MathUtils.lerp(1 + OPEN_ORANGE_SCALE * o, REVEAL_ORANGE_SCALE, grow))
      } else if (smoothOpen > 0) {
        const o = smoothstep(0, 1, (smoothOpen - c.openDelay) / (1 - OPEN_STAGGER))
        tmpDir.copy(c.slot).normalize()
        const back = smoothstep(0, 0.6, r)
        tmpPos.addScaledVector(tmpDir, OPEN_DISTANCE * o + REVEAL_DISTANCE * back)
        if (back > 0) tmpPos.addScaledVector(cameraLocal, -REVEAL_BACK * back)
        tmpQuat.premultiply(openQuat.setFromAxisAngle(c.openAxis, c.openSpin * o))
      }
      if (c.t < 1) {
        c.group.position.lerpVectors(c.startPos, tmpPos, c.t)
        c.group.quaternion.slerpQuaternions(c.startQuat, tmpQuat, c.t)
      } else {
        c.group.position.copy(tmpPos)
        c.group.quaternion.copy(tmpQuat)
      }
    }
  }

  /** Cor das faces: externas usam a pele; internas (vistas ao abrir) ficam escuras. */
  function updateFaces(c: Cubelet) {
    if (orangeAllSkin && c.skin === orangeSkin) {
      c.mesh.material = orangeLidOpen ? orangeOpenFaces : orangeClosedFaces
      return
    }
    const n = new THREE.Vector3()
    c.mesh.material = FACE_NORMALS.map((normal) => {
      n.copy(normal).applyQuaternion(c.quat).round()
      return n.dot(c.slot) > 0 ? c.skin : innerMaterial
    })
  }

  const applyFrame = (dt: number, elapsed: number) => {
    const follow = reducedMotion ? 1 : Math.min(1, dt * 8)
    smoothScroll += (state.scroll - smoothScroll) * follow
    smoothUnlock += (state.unlock - smoothUnlock) * follow
    smoothOpen += (state.open - smoothOpen) * follow
    smoothReveal += (state.reveal - smoothReveal) * follow
    const u = smoothstep(0, 1, smoothUnlock)
    // Ao destravar, o cubo para de balançar e flutuar
    const idle = state.idle * (1 - u)

    pointer.sx += (pointer.x - pointer.sx) * 0.05
    pointer.sy += (pointer.y - pointer.sy) * 0.05
    if (!drag.active) {
      // Inércia do arrasto e retorno suave ao ângulo de quina do símbolo
      rotation.yaw += rotation.vYaw
      rotation.vYaw *= 0.93
      rotation.yaw = Math.atan2(Math.sin(rotation.yaw), Math.cos(rotation.yaw))
      rotation.yaw *= 1 - Math.min(1, dt * 1.2)
      rotation.pitch *= 1 - Math.min(1, dt * 1.8)
    }
    const swayYaw = Math.sin(elapsed * 0.4) * 0.3 * idle
    const swayPitch = Math.sin(elapsed * 0.3) * 0.06 * idle
    // Pose livre (arrasto, balanço, mouse) → pose de vitrine conforme destrava
    const freePitch = rotation.pitch + swayPitch + pointer.sy * 0.08 * idle
    const freeYaw = REST_YAW + rotation.yaw + swayYaw + pointer.sx * 0.2 * idle
    // …e ao abrir vira quase de frente, para as caixinhas se espalharem pelos lados
    const turn = smoothstep(0, 0.6, smoothOpen)
    cubeRoot.rotation.set(
      THREE.MathUtils.lerp(THREE.MathUtils.lerp(freePitch, UNLOCK_PITCH, u), OPEN_PITCH, turn) + smoothScroll * 0.5,
      THREE.MathUtils.lerp(THREE.MathUtils.lerp(freeYaw, UNLOCK_YAW, u), OPEN_YAW, turn) + smoothScroll * Math.PI * 0.6,
      0,
    )
    cubeRoot.position.y = Math.sin(elapsed * 1.3) * 0.07 * idle

    // Contorno mais grosso: as linhas onde o cubo vai se separar ficam em evidência
    lineMaterial.linewidth = baseLineWidth * (1 + UNLOCK_LINE_BOOST * u)

    updateCubelets()
    // Clique de luz no fim do destrave
    const unlockFlash = smoothstep(0.75, 1, smoothUnlock) * 0.8
    // Fase 2: a luz que escapa entre as caixinhas esquenta até o laranja e pulsa no centro
    const open = smoothstep(0, 1, smoothOpen)
    const pulse = 1 + Math.sin(elapsed * 3) * 0.08 * open
    glowMaterial.color.lerpColors(glowBlue, glowOrange, smoothstep(0.3, 0.9, smoothOpen))
    orangeGlow.value = smoothstep(0.35, 1, smoothOpen) * pulse
    glow.scale.setScalar(
      (state.glow * (1 + Math.sin(elapsed * 2.4) * 0.05 * idle) + unlockFlash + open * 2.2) * pulse + smoothScroll * 3,
    )
    shadow.scale.setScalar(1 + state.spread * 0.6 + smoothScroll + open * 0.8)
    stage.scale.setScalar(baseStageScale * (1 - OPEN_ZOOM_OUT * open))

    // Fase 3: as azuis escurecem; a tampa surge, gira para trás e a luz sai de dentro
    blueDim.value = REVEAL_DIM * smoothstep(0, 0.6, smoothReveal)
    lidPivot.visible = smoothReveal > 0.01
    lid.scale.y = Math.max(0.001, smoothstep(0, 0.25, smoothReveal))
    const lidT = smoothstep(0.5, 1, smoothReveal)
    const lidPop = lidEase(lidT)
    lidPivot.position.set(0, 0.5 + REVEAL_LID_LIFT * lidPop, -0.54 - REVEAL_LID_BACK * lidPop)
    lidPivot.rotation.x = -REVEAL_LID_ANGLE * lidPop
    const lidOpen = lidT > 0.03
    if (lidOpen !== orangeLidOpen) {
      orangeLidOpen = lidOpen
      updateFaces(orangeCubelet)
    }
    beam.visible = lidT > 0
    beam.scale.set(1.6 * lidT * pulse, 2.4 * lidT * pulse, 1)
    particles.update(state.burst)
    stars.rotation.y += dt * 0.006
  }

  /* ---------------- Layout responsivo ---------------- */

  const render = () => {
    // Sem o loop (movimento reduzido), aplica aqui o estado atual
    if (reducedMotion) applyFrame(0, 0)
    renderer.render(scene, camera)
  }

  const layout = () => {
    const width = container.clientWidth
    const height = container.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height, false)
    lineMaterial.resolution.set(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAMERA_DISTANCE
    const viewW = viewH * camera.aspect
    let s: number
    if (width >= DESKTOP_MIN_WIDTH) {
      s = Math.min(1.2, (viewW * 0.42) / WORLD_SIZE, (viewH * 0.68) / WORLD_SIZE)
      baseStageScale = s
      stage.position.set(viewW * 0.23, 0, 0)
    } else {
      // Encaixa o cubo entre o cabeçalho e o topo do texto
      const pxToUnits = viewH / height
      const textTop = textElement
        ? textElement.getBoundingClientRect().top - container.getBoundingClientRect().top
        : height * 0.45
      const regionPx = Math.max(textTop - MOBILE_HEADER_PX, height * 0.2)
      const centerPx = MOBILE_HEADER_PX + regionPx / 2
      s = Math.min(1, (viewW * 0.8) / WORLD_SIZE, (regionPx * pxToUnits) / WORLD_SIZE)
      baseStageScale = s
      stage.position.set(0, CAMERA_TARGET.y + (height / 2 - centerPx) * pxToUnits, 0)
    }
    // Contorno proporcional ao cubo na tela (~3% da aresta, como no símbolo)
    const cubePx = 2 * s * (height / viewH)
    cubeScreenPx = cubePx
    stage.scale.setScalar(s * (1 - OPEN_ZOOM_OUT * smoothstep(0, 1, smoothOpen)))
    baseLineWidth = Math.max(2.5, cubePx * 0.03)
    lineMaterial.linewidth = baseLineWidth * (1 + UNLOCK_LINE_BOOST * smoothstep(0, 1, smoothUnlock))
    if (reducedMotion) render()
  }

  /* ---------------- Loop ---------------- */

  const timer = new THREE.Timer()
  let elapsed = 0
  const tick = (time: number) => {
    timer.update(time)
    const dt = Math.min(timer.getDelta(), 0.05)
    elapsed += dt
    applyFrame(dt, elapsed)
    camera.lookAt(CAMERA_TARGET)
    renderer.render(scene, camera)
  }

  /* ---------------- Timeline de entrada ---------------- */

  const intro = gsap.timeline()
  intro.fromTo(
    camera.position,
    { z: CAMERA_DISTANCE + 3 },
    { z: CAMERA_DISTANCE, duration: 2.6, ease: 'power2.out' },
    0,
  )
  // Monta de baixo para cima; o laranja encaixa por último
  const assemblyOrder = [...cubelets].sort(
    (a, b) => Number(a.skin === orangeSkin) - Number(b.skin === orangeSkin) || a.slot.y - b.slot.y,
  )
  assemblyOrder.forEach((c, i) => {
    intro.to(c, { t: 1, duration: 1.1, ease: 'expo.out' }, 0.05 + i * 0.07)
  })
  intro
    .fromTo(shadowMaterial, { opacity: 0 }, { opacity: 0.55, duration: 1 }, 0.3)
    // "Um universo inteiro.": o cubo se abre, a luz escapa e as partículas explodem
    .to(state, { spread: 0.5, duration: 0.6, ease: 'expo.out' }, HERO_WORLD_REVEAL_AT)
    .to(state, { glow: 3.2, duration: 0.6, ease: 'expo.out' }, HERO_WORLD_REVEAL_AT)
    .fromTo(state, { burst: 0 }, { burst: 1, duration: 1.8, ease: 'power2.out' }, HERO_WORLD_REVEAL_AT)
    .to(state, { spread: 0, duration: 0.9, ease: 'back.inOut(1.8)' }, HERO_WORLD_REVEAL_AT + 0.75)
    .to(state, { glow: 1.2, duration: 1 }, HERO_WORLD_REVEAL_AT + 0.75)
    .to(state, { idle: 1, duration: 1.5, ease: 'power1.inOut' }, HERO_WORLD_REVEAL_AT + 1.1)

  if (!reducedMotion) {
    intro.call(() => startTwist('y', 1, 1, { duration: 0.6, record: 'auto' }), [], 1.05).call(scheduleTwists, [], HERO_WORLD_REVEAL_AT + 2.4)
  }

  /* ---------------- Eventos ---------------- */

  const resizeObserver = new ResizeObserver(layout)
  resizeObserver.observe(container)
  if (textElement) resizeObserver.observe(textElement)
  layout()

  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const meshes = cubelets.map((c) => c.mesh)
  const tmpWorld = new THREE.Vector3()
  const tmpTip = new THREE.Vector3()
  const worldQuat = new THREE.Quaternion()
  const screenA = new THREE.Vector2()
  const screenB = new THREE.Vector2()
  const ORIGIN = new THREE.Vector3()

  /** Durante a abertura (e a resolução) o cubo é do scroll, não do visitante. */
  function canInteract() {
    return state.idle > 0.5 && state.unlock <= 0.05 && smoothScroll < 0.05 && !solving
  }

  const hitTest = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(ndc, camera)
    return raycaster.intersectObjects(meshes, false)[0] ?? null
  }

  /** Ponto em coordenadas do cubeRoot → px dentro do canvas. */
  const toScreen = (local: THREE.Vector3, out: THREE.Vector2) => {
    tmpWorld.copy(local)
    cubeRoot.localToWorld(tmpWorld).project(camera)
    return out.set(((tmpWorld.x + 1) / 2) * canvas.clientWidth, ((1 - tmpWorld.y) / 2) * canvas.clientHeight)
  }

  /** Perto do cubo, mas fora dos blocos: área para girar o cubo inteiro (só mouse). */
  const nearCube = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    toScreen(ORIGIN, screenA)
    return Math.hypot(clientX - rect.left - screenA.x, clientY - rect.top - screenA.y) < cubeScreenPx * 1.15
  }

  /** Decide, pela direção do arrasto, qual camada do bloco tocado vai girar. */
  function beginTwist(dx: number, dy: number) {
    const c = drag.cubelet
    if (!c || twist.active) return
    const eps = 0.05
    toScreen(drag.point, screenA)
    let best: { axis: Axis; tx: number; ty: number } | null = null
    let bestScore = 0
    for (const axis of ['x', 'y', 'z'] as Axis[]) {
      if (axis === drag.normalAxis) continue
      // Girar a camada em torno do eixo move o ponto tocado na direção eixo × ponto
      tmpTip.crossVectors(AXES[axis], drag.point).multiplyScalar(eps).add(drag.point)
      toScreen(tmpTip, screenB)
      const tx = (screenB.x - screenA.x) / eps
      const ty = (screenB.y - screenA.y) / eps
      const length = Math.hypot(tx, ty)
      if (length < 1) continue
      const score = Math.abs(dx * tx + dy * ty) / length
      if (score > bestScore) {
        bestScore = score
        best = { axis, tx, ty }
      }
    }
    if (!best) return
    drag.tangent.set(best.tx, best.ty)
    drag.velocity = 0
    drag.mode = 'twist'
    Object.assign(twist, { axis: best.axis, layer: c.slot[best.axis], angle: 0, active: true })
  }

  /** Solta a camada: encaixa no quarto de volta mais próximo (o "peteleco" conta). */
  function releaseTwist() {
    const quarter = Math.PI / 2
    const turns = THREE.MathUtils.clamp(Math.round((twist.angle + drag.velocity * 4) / quarter), -2, 2)
    tweenTwistTo(turns, 0.3, 'back.out(1.6)', 'user')
  }

  const onWindowPointerMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  const onPointerDown = (e: PointerEvent) => {
    if (!canInteract() || drag.active) return
    const hit = hitTest(e.clientX, e.clientY)
    if (!hit && !(e.pointerType === 'mouse' && nearCube(e.clientX, e.clientY))) return
    // Um giro automático (ou o encaixe anterior) termina na hora para o visitante jogar
    if (twist.active) twistTween?.progress(1)
    if (twist.active) return
    Object.assign(drag, {
      active: true,
      id: e.pointerId,
      mode: hit ? 'pending' : 'orbit',
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      cubelet: null,
    })
    if (hit?.face) {
      drag.cubelet = cubelets.find((c) => c.mesh === hit.object) ?? null
      cubeRoot.updateMatrixWorld()
      cubeRoot.worldToLocal(drag.point.copy(hit.point))
      cubeRoot.getWorldQuaternion(worldQuat).invert()
      tmpWorld.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).applyQuaternion(worldQuat)
      drag.normalAxis = dominantAxis(tmpWorld)
    }
    canvas.setPointerCapture(e.pointerId)
    canvas.style.cursor = 'grabbing'
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.active) {
      if (e.pointerType === 'mouse') {
        const over = canInteract() && (hitTest(e.clientX, e.clientY) !== null || nearCube(e.clientX, e.clientY))
        canvas.style.cursor = over ? 'grab' : ''
      }
      return
    }
    if (e.pointerId !== drag.id) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    drag.x = e.clientX
    drag.y = e.clientY
    const totalX = e.clientX - drag.startX
    const totalY = e.clientY - drag.startY
    if (Math.hypot(totalX, totalY) > 6) drag.moved = true

    if (drag.mode === 'orbit') {
      rotation.yaw += dx * 0.01
      rotation.vYaw = dx * 0.01
      rotation.pitch = THREE.MathUtils.clamp(rotation.pitch + dy * 0.006, -0.6, 0.6)
      return
    }
    if (drag.mode === 'pending' && Math.hypot(totalX, totalY) > 10) beginTwist(totalX, totalY)
    if (drag.mode === 'twist') {
      // A camada acompanha o dedo: projeção do arrasto na direção do giro
      const angle = THREE.MathUtils.clamp(
        (totalX * drag.tangent.x + totalY * drag.tangent.y) / drag.tangent.lengthSq(),
        -Math.PI,
        Math.PI,
      )
      drag.velocity = drag.velocity * 0.5 + (angle - twist.angle) * 0.5
      twist.angle = angle
    }
  }
  const endDrag = (e: PointerEvent, cancelled: boolean) => {
    if (!drag.active || e.pointerId !== drag.id) return
    drag.active = false
    canvas.style.cursor = canInteract() ? 'grab' : ''
    if (drag.mode === 'twist') releaseTwist()
    else if (drag.mode === 'pending' && !cancelled && !drag.moved) play()
  }
  const onPointerUp = (e: PointerEvent) => endDrag(e, false)
  const onPointerCancel = (e: PointerEvent) => endDrag(e, true)
  // Toque em cima de um bloco é jogo, não scroll; fora do cubo a página rola normalmente
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    if (e.touches.length === 1 && touch && canInteract() && hitTest(touch.clientX, touch.clientY)) e.preventDefault()
  }

  // Só anima enquanto o hero está visível
  let visibilityObserver: IntersectionObserver | null = null
  if (!reducedMotion) {
    window.addEventListener('pointermove', onWindowPointerMove, { passive: true })
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerCancel)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    visibilityObserver = new IntersectionObserver(([entry]) => {
      renderer.setAnimationLoop(entry.isIntersecting ? tick : null)
    })
    visibilityObserver.observe(container)
  }

  const setScroll = (progress: number) => {
    state.scroll = progress
    if (progress > 0.01) solve()
    if (reducedMotion) render()
  }

  const setUnlock = (progress: number) => {
    state.unlock = THREE.MathUtils.clamp(progress, 0, 1)
    // Começou a rolar: o cubo se resolve sozinho antes de destravar
    if (state.unlock > 0.01) solve()
    if (reducedMotion) render()
  }

  const setOpen = (progress: number) => {
    state.open = THREE.MathUtils.clamp(progress, 0, 1)
    if (reducedMotion) render()
  }

  const anchorPoint = new THREE.Vector3()
  const getAnchor = () => {
    // Centro do topo da caixa laranja (a abertura), projetado na tela
    orangeCubelet.group.localToWorld(anchorPoint.set(0, 0.5, 0)).project(camera)
    return {
      x: ((anchorPoint.x + 1) / 2) * canvas.clientWidth,
      y: ((1 - anchorPoint.y) / 2) * canvas.clientHeight,
    }
  }

  const setReveal = (progress: number) => {
    state.reveal = THREE.MathUtils.clamp(progress, 0, 1)
    if (reducedMotion) render()
  }

  const dispose = () => {
    renderer.setAnimationLoop(null)
    twistTween?.kill()
    nextTwist?.kill()
    gsap.killTweensOf(state)
    timer.dispose()
    resizeObserver.disconnect()
    visibilityObserver?.disconnect()
    window.removeEventListener('pointermove', onWindowPointerMove)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerCancel)
    canvas.removeEventListener('touchstart', onTouchStart)
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) obj.geometry.dispose()
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Sprite) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of materials) m.dispose()
      }
    })
    interiorMaterial.dispose()
    lidInsideMaterial.dispose()
    glowTexture.dispose()
    shadowTexture.dispose()
    dotTexture.dispose()
    renderer.dispose()
    canvas.remove()
  }

  return { intro, setScroll, setUnlock, setOpen, setReveal, getAnchor, render, dispose }
}

function normalizeTurns(turns: number) {
  const r = ((turns % 4) + 4) % 4
  return r === 3 ? -1 : r
}

function dominantAxis(v: THREE.Vector3): Axis {
  const ax = Math.abs(v.x)
  const ay = Math.abs(v.y)
  const az = Math.abs(v.z)
  if (ax >= ay && ax >= az) return 'x'
  return ay >= az ? 'y' : 'z'
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/* ------------------------------------------------------------------ */
/* Peças da cena                                                       */
/* ------------------------------------------------------------------ */

type FacePalette = { top: number; front: number; side: number; bottom: number }

/**
 * Pele no estilo do símbolo: cores chapadas escolhidas pela normal em
 * coordenadas de mundo. Assim o topo é sempre claro e a lateral sempre
 * escura, mesmo com o cubo girando — e a transição entre tons é suave.
 */
function skinMaterial(p: FacePalette) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color(p.top) },
      uFront: { value: new THREE.Color(p.front) },
      uSide: { value: new THREE.Color(p.side) },
      uBottom: { value: new THREE.Color(p.bottom) },
      /** 0 = cor chapada; 1 = acesa por dentro (caixinha laranja na fase 2). */
      uGlow: { value: 0 },
      /** 0 = cor normal; 1 = apagada no escuro (caixinhas azuis na fase 3). */
      uDim: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uFront;
      uniform vec3 uSide;
      uniform vec3 uBottom;
      uniform float uGlow;
      uniform float uDim;
      varying vec3 vNormal;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 h = vec3(n.x, 0.0, n.z);
        float hl = length(h);
        h = hl > 1e-4 ? h / hl : vec3(0.0, 0.0, 1.0);
        // Luz vindo da frente-esquerda, como no símbolo
        float facing = dot(h, normalize(vec3(-0.8, 0.0, 1.0))) * 0.5 + 0.5;
        vec3 color = mix(uSide, uFront, smoothstep(0.55, 0.85, facing));
        color = mix(color, uTop, smoothstep(0.45, 0.7, n.y));
        color = mix(color, uBottom, smoothstep(0.45, 0.7, -n.y));
        // Aceso por dentro: as faces escuras clareiam mais que o topo
        color = mix(color, uTop, uGlow * 0.55) + uTop * uGlow * 0.25;
        color = mix(color, vec3(0.02, 0.05, 0.11), uDim);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
    // Empurra as faces para trás para o contorno sempre ficar por cima
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
}

function makeParticles(rand: () => number, texture: THREE.Texture) {
  const count = 90
  const directions: THREE.Vector3[] = []
  const distances: number[] = []
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const palette = [0x52d3ff, 0x84dcff, 0xff8a1f, 0xffffff, 0x049fdf].map((c) => new THREE.Color(c))
  for (let i = 0; i < count; i++) {
    directions.push(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize())
    distances.push(1.8 + rand() * 2.6)
    palette[i % palette.length].toArray(colors, i * 3)
  }
  const geometry = new THREE.BufferGeometry()
  const positionAttr = new THREE.BufferAttribute(positions, 3)
  geometry.setAttribute('position', positionAttr)
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const material = new THREE.PointsMaterial({
    size: 0.13,
    map: texture,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.visible = false

  const update = (burst: number) => {
    if (burst <= 0 || burst >= 1) {
      points.visible = false
      return
    }
    points.visible = true
    const eased = 1 - Math.pow(1 - burst, 3)
    for (let i = 0; i < count; i++) {
      const d = directions[i]
      const r = distances[i] * eased
      positions[i * 3] = d.x * r
      positions[i * 3 + 1] = d.y * r - burst * burst * 0.6
      positions[i * 3 + 2] = d.z * r
    }
    positionAttr.needsUpdate = true
    material.opacity = Math.min(1, burst * 10) * (1 - burst)
  }

  return { points, update }
}

function makeStars(rand: () => number, texture: THREE.Texture) {
  const count = 450
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * 50
    positions[i * 3 + 1] = (rand() - 0.5) * 28
    positions[i * 3 + 2] = -8 - rand() * 30
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.12,
      map: texture,
      color: 0xd6e8ff,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  )
}

function radialTexture(stops: [offset: number, color: string][]) {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    for (const [offset, color] of stops) gradient.addColorStop(offset, color)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** PRNG determinístico: a cena é sempre igual entre carregamentos. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
