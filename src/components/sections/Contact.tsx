import { useRef } from 'react'
import { ArrowRight, FileText, Mail } from 'lucide-react'
import { useSection } from '@/hooks/use-section'
import { externalProps, SITE_LINKS } from '@/lib/site-links'

export function Contact() {
  const rootRef = useRef<HTMLElement>(null)
  useSection(rootRef, { id: 'contato', label: 'Contato', order: 50 })

  return (
    <section
      id="contato"
      ref={rootRef}
      aria-labelledby="contato-title"
      className="relative overflow-hidden bg-navy-950 px-3.5 py-24 text-snow lg:px-4.5 lg:py-40"
    >
      {/* Brilho azul ao fundo, como atrás do cubo no hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgb(4_159_223/0.28),transparent_60%)]"
      />

      <div className="relative mx-auto max-w-5xl text-center">
        <p data-reveal className="text-xs font-bold tracking-[0.2em] text-orange uppercase sm:text-sm">
          Vamos conversar?
        </p>
        <h2
          data-reveal
          id="contato-title"
          className="mt-4 font-heading text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-8xl"
        >
          Grandes ideias começam com uma <span className="text-cyan">conversa.</span>
        </h2>
        <p data-reveal className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist sm:text-lg">
          Tem uma sugestão, uma proposta de parceria ou simplesmente quer falar sobre nossos jogos? Estamos por aqui.
        </p>

        <div data-reveal className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
          <a
            href={SITE_LINKS.contact}
            {...externalProps(SITE_LINKS.contact)}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-orange px-6 text-base font-bold text-navy-950 shadow-[0_4px_0_0_var(--color-ember)] transition-[translate,background-color] hover:-translate-y-0.5 hover:bg-orange-soft"
          >
            <Mail aria-hidden className="size-4" />
            Entre em contato
          </a>
          {/* Âncora de "Imprensa" no menu do topo */}
          <a
            id="imprensa"
            href={SITE_LINKS.pressKit}
            {...externalProps(SITE_LINKS.pressKit)}
            className="group inline-flex items-center gap-2 text-base font-semibold text-snow underline-offset-4 hover:text-cyan hover:underline"
          >
            <FileText aria-hidden className="size-4" />
            Acesse nosso press kit
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </section>
  )
}
