/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
        },
        slate: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
        },
        border: {
          light: '#f1f5f9',
          DEFAULT: '#e2e8f0',
          input: '#cbd5e1',
        },
        success: {
          bg: '#ecfdf5',
          dot: '#10b981',
          text: '#047857',
        },
        info: {
          bg: '#eff6ff',
          dot: '#2563eb',
          text: '#1d4ed8',
        },
        danger: {
          DEFAULT: '#f43f5e',
        },
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
      boxShadow: {
        card: '0px 1px 2px rgba(0, 0, 0, 0.05)',
      },
      fontSize: {
        h1: ['24px', { lineHeight: '32px', letterSpacing: '-0.6px' }],
        body: ['12px', { lineHeight: '16px' }],
        secondary: ['11px', { lineHeight: '16.5px' }],
        label: ['10px', { lineHeight: '16px' }],
      },
    },
  },
  plugins: [],
};
