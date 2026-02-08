/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        accent: '#0070FF',        // Electric blue
        secondary: '#505050',     // Secondary gray
        success: '#10B981',       // Green
        highlight: '#0070FF',     // Electric blue
        obsidian: {
          bg: '#050505',          // Background
          surface: '#121212',     // Cards/Surface
          border: 'rgba(80, 80, 80, 0.3)', // Borders
        },
        neutral: {
          50: '#F5F5F7',          // Text primary
          100: '#E5E5E7',         // Light gray
          200: '#C5C5C7',         // Gray
          300: '#A1A1A6',         // Medium gray
          400: '#86868B',         // Darker gray
          500: '#505050',         // Secondary accent
          600: '#3A3A3C',         // Very dark gray
          900: '#121212',         // Surface
          950: '#050505',         // Background
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
