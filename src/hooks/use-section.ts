import { type RefObject, useEffect } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { registerStops } from '@/lib/scroll-stops'

type SectionStop = { id: string; label: string; order: number }

/**
 * Comportamento comum das seções "de conteúdo":
 * - registra a seção como uma parada da navegação lateral;
 * - faz os elementos marcados com `data-reveal` subirem e aparecerem ao entrar na tela,
 *   em pequenos grupos (ScrollTrigger.batch), uma vez só.
 */
export function useSection(ref: RefObject<HTMLElement | null>, { id, label, order }: SectionStop) {
  useEffect(
    () =>
      registerStops([
        {
          id,
          label,
          order,
          getY: () => (ref.current ? ref.current.getBoundingClientRect().top + window.scrollY : 0),
        },
      ]),
    [ref, id, label, order],
  )

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', ref.current)
      if (!items.length) return
      // Só opacidade (não visibility): o conteúdo continua alcançável pelo Tab antes de aparecer;
      // ao receber foco a página rola até ele e a entrada acontece.
      gsap.set(items, { y: 36, opacity: 0 })
      ScrollTrigger.batch(items, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' }),
      })
    },
    { scope: ref },
  )
}
