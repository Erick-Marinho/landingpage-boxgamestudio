/**
 * Links externos do site. Ainda sem os endereços reais (não estão nos docs):
 * preencher aqui e todas as seções passam a usar.
 */
export const SITE_LINKS = {
  instagram: '#comunidade',
  facebook: '#comunidade',
  /** Ex.: 'mailto:contato@boxgamestudio.com.br' */
  contact: '#contato',
  pressKit: '#imprensa',
  studio: '#estudio',
}

/** Abre em nova aba só quando o link for de fato externo. */
export const externalProps = (href: string) =>
  href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}
