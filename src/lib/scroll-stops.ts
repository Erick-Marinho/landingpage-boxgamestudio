/**
 * Paradas de navegação da página: cada seção registra os pontos para onde a navegação
 * lateral pode levar (posição de scroll). Seções com cena fixa (pin) e scroll horizontal
 * não têm uma âncora no DOM para cada momento, então informam a posição calculada.
 */
export type ScrollStop = {
  id: string
  label: string
  /** Ordem na página (menor = mais acima). */
  order: number
  /** Posição de scroll (px) da parada; chamada sempre que a navegação precisa dela. */
  getY: () => number
}

const stops = new Map<string, ScrollStop>()
const listeners = new Set<() => void>()
/** Lista ordenada estável entre mudanças (o React compara por referência). */
let snapshot: ScrollStop[] = []

const notify = () => {
  snapshot = [...stops.values()].sort((a, b) => a.order - b.order)
  for (const listener of listeners) listener()
}

export function registerStops(list: ScrollStop[]) {
  for (const stop of list) stops.set(stop.id, stop)
  notify()
  return () => {
    for (const stop of list) stops.delete(stop.id)
    notify()
  }
}

export function getStops() {
  return snapshot
}

/** Rola até a parada (suave, ou direto com "reduzir movimento"). */
export function scrollToStop(stop: ScrollStop) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: stop.getY(), behavior: reducedMotion ? 'auto' : 'smooth' })
}

export function subscribeStops(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
