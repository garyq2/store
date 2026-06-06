/**
 * Store — Tailwind theme extension.
 * Maps Tailwind utilities onto the semantic CSS variables in tokens.css so the
 * whole UI is themeable (light/dark) by swapping variables, not class names.
 *
 * Usage (tailwind.config.js):
 *   const storeTheme = require('./design/tailwind.theme.cjs')
 *   module.exports = { darkMode: 'class', theme: { extend: storeTheme }, ... }
 *
 * Then: bg-bg, text-text, bg-surface, border-border, bg-primary-fill,
 * text-on-primary, rounded-xl, shadow-md, etc.
 */
module.exports = {
  colors: {
    bg: 'var(--color-bg)',
    surface: 'var(--color-surface)',
    'surface-2': 'var(--color-surface-2)',
    border: 'var(--color-border)',
    'border-strong': 'var(--color-border-strong)',
    text: {
      DEFAULT: 'var(--color-text)',
      muted: 'var(--color-text-muted)',
      subtle: 'var(--color-text-subtle)',
    },
    primary: {
      DEFAULT: 'var(--color-primary)',
      fill: 'var(--color-primary-fill)',
      hover: 'var(--color-primary-hover)',
      subtle: 'var(--color-primary-subtle)',
    },
    'on-primary': 'var(--color-on-primary)',
    secondary: {
      DEFAULT: 'var(--color-secondary)',
      hover: 'var(--color-secondary-hover)',
      subtle: 'var(--color-secondary-subtle)',
    },
    'on-secondary': 'var(--color-on-secondary)',
    success: { DEFAULT: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    warning: { DEFAULT: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    error: { DEFAULT: 'var(--color-error)', bg: 'var(--color-error-bg)' },
    info: { DEFAULT: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  },
  fontFamily: {
    display: 'var(--font-display)',
    body: 'var(--font-body)',
    mono: 'var(--font-mono)',
  },
  fontSize: {
    xs: ['var(--text-xs)', 'var(--lh-xs)'],
    sm: ['var(--text-sm)', 'var(--lh-sm)'],
    base: ['var(--text-base)', 'var(--lh-base)'],
    lg: ['var(--text-lg)', 'var(--lh-lg)'],
    xl: ['var(--text-xl)', 'var(--lh-xl)'],
    '2xl': ['var(--text-2xl)', 'var(--lh-2xl)'],
    '3xl': ['var(--text-3xl)', 'var(--lh-3xl)'],
    '4xl': ['var(--text-4xl)', 'var(--lh-4xl)'],
    '5xl': ['var(--text-5xl)', 'var(--lh-5xl)'],
  },
  borderRadius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    '2xl': 'var(--radius-2xl)',
    full: 'var(--radius-full)',
  },
  boxShadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    focus: 'var(--shadow-focus)',
  },
  transitionTimingFunction: {
    standard: 'var(--ease-standard)',
    emphasized: 'var(--ease-emphasized)',
  },
  transitionDuration: {
    fast: 'var(--dur-fast)',
    base: 'var(--dur-base)',
    slow: 'var(--dur-slow)',
  },
  zIndex: {
    header: 'var(--z-header)',
    drawer: 'var(--z-drawer)',
    modal: 'var(--z-modal)',
    toast: 'var(--z-toast)',
  },
}
