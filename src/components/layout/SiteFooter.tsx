import logo from '@/assets/brand/logo-box-game-studio.webp'
import { externalProps, SITE_LINKS } from '@/lib/site-links'

const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Jogos', href: '#jogos' },
  { label: 'Estúdio', href: '#estudio' },
  { label: 'Imprensa', href: '#imprensa' },
  { label: 'Contato', href: '#contato' },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: SITE_LINKS.instagram },
  { label: 'Facebook', href: SITE_LINKS.facebook },
]

const linkClass = 'transition-colors hover:text-cyan'
/** Calculado uma vez ao carregar (fora do render, que deve ser puro). */
const YEAR = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-950 px-3.5 pt-16 pb-8 text-snow lg:px-4.5 lg:pt-20">
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <img src={logo} alt="Box Game Studio" width={364} height={132} className="h-11 w-auto lg:h-14" loading="lazy" />
          <p className="mt-6 font-heading text-2xl leading-tight font-extrabold lg:text-3xl">
            Criando mundos. <span className="text-cyan">Compartilhando diversão.</span>
          </p>
          <p className="mt-3 text-sm text-mist">Estúdio independente brasileiro desde 2013, criado por Luiz Farias.</p>
        </div>

        <nav aria-label="Rodapé">
          <h2 className="text-xs font-bold tracking-[0.2em] text-mist/70 uppercase">Navegação</h2>
          <ul className="mt-4 space-y-2.5 text-sm font-medium tracking-[0.15em] uppercase">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-bold tracking-[0.2em] text-mist/70 uppercase">Redes</h2>
          <ul className="mt-4 space-y-2.5 text-sm font-medium tracking-[0.15em] uppercase">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} {...externalProps(link.href)} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-mist/70 sm:flex-row sm:justify-between">
        <p>© {YEAR} Box Game Studio. Todos os direitos reservados.</p>
        <p>Feito no Brasil. Criado para quem ama jogar.</p>
      </div>
    </footer>
  )
}
