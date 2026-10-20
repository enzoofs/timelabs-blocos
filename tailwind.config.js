/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bungee', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        // identidade da própria TimeLabs (site/produto de vendas) —
        // separada das cores que cada bloco escolhe pro sistema dele
        tl: {
          ink: '#161616',
          paper: '#f5f0e6',
          muted: '#8a8175',
          violet: '#7c3aed',
          'violet-deep': '#5b21b6',
          lime: '#c6f135',
          red: '#e63946',
          green: '#06a77d',
        },
        // sistema de check-in de cada bloco: cores resolvidas em runtime
        // via CSS custom properties (ver BlocoProvider), a partir do
        // theme {primary, accent} que o próprio bloco escolheu no
        // cadastro. ink/paper/muted ficam fixos — só primary/accent
        // variam por bloco.
        bloco: {
          primary: 'var(--bloco-primary)',
          accent: 'var(--bloco-accent)',
          // versão escurecida do accent, só pra texto em cima de fundo
          // claro — o accent puro é escolhido livremente pelo diretor
          // (pode ser amarelo, verde-claro etc) e fica ilegível como
          // cor de texto direto no papel/branco.
          'accent-text': 'var(--bloco-accent-text)',
          ink: '#161616',
          paper: '#faf6ee',
          muted: '#8a8175',
          red: '#e63946',
          green: '#06a77d',
        },
      },
      boxShadow: {
        hard: '4px 4px 0 #161616',
        'hard-lg': '7px 7px 0 #161616',
        'hard-sm': '3px 3px 0 rgba(0,0,0,0.35)',
        'hard-violet': '6px 6px 0 #7c3aed',
        'hard-bloco': '6px 6px 0 var(--bloco-primary)',
      },
      backgroundImage: {
        halftone: 'radial-gradient(circle, rgba(124,58,237,0.5) 1.5px, transparent 1.6px)',
      },
      // movimento: só transform/opacity (roda liso em Android barato) e
      // com "peso" físico — combina com a sombra dura da identidade.
      // Tudo é desligado em prefers-reduced-motion (ver index.css).
      transitionTimingFunction: {
        bounce: 'cubic-bezier(.34,1.56,.64,1)',
        snap: 'cubic-bezier(.2,.8,.2,1)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(.9)' },
          '60%': { opacity: '1', transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-4deg)' },
          '75%': { transform: 'rotate(4deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        stamp: {
          '0%': { opacity: '0', transform: 'scale(1.6) rotate(-8deg)' },
          '55%': { opacity: '1', transform: 'scale(.94) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { opacity: '.7', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(2.6)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scan: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(var(--scan-distance, 280px))' },
        },
        draw: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        flash: {
          '0%': { opacity: '.85' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'pop-in': 'pop-in .35s cubic-bezier(.34,1.56,.64,1) both',
        rise: 'rise .35s cubic-bezier(.2,.8,.2,1) both',
        wiggle: 'wiggle .5s ease-in-out',
        shake: 'shake .4s ease-in-out',
        stamp: 'stamp .45s cubic-bezier(.34,1.56,.64,1) both',
        shimmer: 'shimmer 1.3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(.2,.8,.2,1) infinite',
        breathe: 'breathe 2s ease-in-out infinite',
        bob: 'bob 1s ease-in-out infinite',
        scan: 'scan 1.8s ease-in-out infinite alternate',
        draw: 'draw .35s .25s ease-out both',
        flash: 'flash .3s ease-out both',
      },
    },
  },
  plugins: [],
}
