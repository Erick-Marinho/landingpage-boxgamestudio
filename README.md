# Box Game Studio — Landing Page

Landing page da Box Game Studio.

## Stack

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) (via `@tailwindcss/vite`)
- [shadcn/ui](https://ui.shadcn.com) (preset Nova / Radix)
- [GSAP](https://gsap.com) + `@gsap/react`
- [Three.js](https://threejs.org)
- [lucide-react](https://lucide.dev)

## Scripts

```bash
npm install      # instala dependências
npm run dev      # servidor de desenvolvimento
npm run build    # type-check + build de produção
npm run preview  # serve o build localmente
npm run lint     # oxlint
```

## Estrutura

```
src/
  components/
    ui/          # componentes shadcn (npx shadcn@latest add <componente>)
    three/       # cenas Three.js
  hooks/
  lib/
    gsap.ts      # registro central de plugins GSAP (useGSAP, ScrollTrigger)
    utils.ts     # cn() do shadcn
```

Imports usam o alias `@/` → `src/`.
