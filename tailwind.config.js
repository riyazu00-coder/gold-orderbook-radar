/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        radar: {
          bg: '#0a0d14',
          card: '#111520',
          border: '#1b2234',
          accent: '#263147',
          buyer: '#10b981',       // Green
          buyerDark: '#064e3b',
          seller: '#f97316',      // Orange / Red
          sellerDark: '#7c2d12',
          pulled: '#eab308',      // Yellow for spoofing/cancellations
          pulledDark: '#713f12',
          textMuted: '#8b949e',
          textBright: '#f0f6fc',
        },
      },
      fontFamily: {
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
