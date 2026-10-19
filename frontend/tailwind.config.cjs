const c = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: c('paper'),
        surface: c('surface'),
        ink: c('ink'),
        muted: c('muted'),
        line: c('line'),
        brand: c('brand'),
        'brand-fg': c('brand-fg'),
        night: c('night'),
        smoke: c('smoke'),
        spark: c('spark'),
        ok: c('ok'),
        bad: c('bad')
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      keyframes: {
        stamp: {
          '0%': { opacity: '0', transform: 'rotate(-14deg) scale(1.9)' },
          '60%': { opacity: '1', transform: 'rotate(-14deg) scale(0.94)' },
          '100%': { opacity: '1', transform: 'rotate(-14deg) scale(1)' }
        },
        tick: { to: { strokeDashoffset: '0' } }
      },
      animation: {
        stamp: 'stamp 420ms cubic-bezier(.2,.9,.3,1.2) both',
        tick: 'tick 260ms ease-out forwards'
      }
    }
  },
  plugins: []
};
