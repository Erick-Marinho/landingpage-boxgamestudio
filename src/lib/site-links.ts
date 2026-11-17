/**
 * Links externos do site: preencher aqui e todas as seções passam a usar.
 * Cada perfil aparece uma vez, no lugar em que faz sentido: o do estúdio na Comunidade e no
 * rodapé, o do jogo no painel do Vida na Fazenda e o do fundador no nome dele (Estúdio).
 */
export const SITE_LINKS = {
  /** Instagram do estúdio */
  instagram: 'https://www.instagram.com/box.gamestudio/',
  /** Instagram do fundador, Luiz Felipe Teixeira */
  founderInstagram: 'https://www.instagram.com/luizfelipe.teixeira/',
  /** Ainda sem endereço. Ex.: 'mailto:contato@boxgamestudio.com.br' */
  contact: '#contato',
  /** Ainda sem endereço */
  pressKit: '#imprensa',
}

/** Onde jogar e onde acompanhar cada jogo (ambos no navegador). */
export const GAME_LINKS = {
  'vida-na-fazenda': {
    play: 'https://play.vidanafazenda.com/',
    instagram: 'https://www.instagram.com/jogovidanafazenda/',
  },
  'spike-rush': {
    play: 'https://play.boxgamestudio.com/',
    instagram: null,
  },
} as const

/** Abre em nova aba só quando o link for de fato externo. */
export const externalProps = (href: string) =>
  href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}
