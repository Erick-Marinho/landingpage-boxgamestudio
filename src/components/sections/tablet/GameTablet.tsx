import { useEffect, useRef } from 'react'

type Props = {
  /** Caminhos relativos a `public/` (o BASE_URL é acrescentado aqui). */
  video: string
  poster: string
  title: string
}

/**
 * Card de jogo em forma de tablet deitado: moldura prateada, borda preta com câmera e,
 * na tela (2:1, a proporção das gravações), o jogo rodando em loop, mudo.
 * O vídeo só toca enquanto o tablet está à vista; com "reduzir movimento", fica a capa.
 */
export function GameTablet({ video, poster, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const base = import.meta.env.BASE_URL
  return (
    <div className="relative rounded-[clamp(1.25rem,3.2vw,2.5rem)] bg-[linear-gradient(145deg,#f4f6f8_0%,#b9c0c8_45%,#e9ecef_70%,#8f979f_100%)] p-[0.45%] shadow-[0_40px_90px_-30px_rgb(0_0_0/0.6),0_12px_24px_-12px_rgb(0_0_0/0.35)]">
      <div className="relative rounded-[clamp(1.1rem,3vw,2.3rem)] bg-[#0b0d12] p-[3.2%]">
        {/* Câmera frontal, no meio da borda de cima */}
        <span
          aria-hidden
          className="absolute top-[1.4%] left-1/2 size-[0.9%] min-h-1 min-w-1 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#3a4a63,#0d1118_70%)] ring-1 ring-white/5"
        />
        <div className="relative aspect-[2/1] overflow-hidden rounded-[clamp(0.4rem,1vw,0.9rem)] bg-black">
          <video
            ref={videoRef}
            src={`${base}${video}`}
            poster={`${base}${poster}`}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${title} em jogo`}
            className="size-full object-cover"
          />
          {/* Reflexo leve do vidro */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.14)_0%,rgb(255_255_255/0.04)_28%,transparent_42%)]"
          />
        </div>
      </div>
    </div>
  )
}
