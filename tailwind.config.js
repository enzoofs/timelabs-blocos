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
    },
  },
  plugins: [],
}
