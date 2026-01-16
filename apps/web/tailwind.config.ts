import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background Colors
        'bg-base': '#09090B',
        'bg-surface': '#111113',
        'bg-elevated': '#18181B',

        // Border Colors
        'border-subtle': '#27272A',
        'border-default': '#3F3F46',

        // Accent Colors
        'accent-primary': '#7DD3FC',
        'accent-hover': '#93C5FD',
        'accent-glow': 'rgba(125, 211, 252, 0.15)',
        'accent-muted': '#0EA5E9',

        // Text Colors
        'text-primary': '#FAFAFA',
        'text-secondary': '#A1A1AA',
        'text-muted': '#71717A',

        // Semantic Colors
        'success': '#0ECC83',
        'warning': '#FBBF24',
        'error': '#F87171',
        'info': '#60A5FA',
      },
      fontSize: {
        'h1': ['2rem', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      transitionDuration: {
        'micro': '150ms',
        'standard': '300ms',
        'emphasis': '500ms',
      },
      transitionTimingFunction: {
        'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(125, 211, 252, 0.15)',
        'glow-lg': '0 0 40px rgba(125, 211, 252, 0.2)',
      },
      borderRadius: {
        'card': '12px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
        'fade-in': 'fade-in 200ms ease-out',
        'slide-down': 'slide-down 200ms ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(125, 211, 252, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(125, 211, 252, 0.25)' },
        },
        'spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
