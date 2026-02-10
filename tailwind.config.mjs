export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Strict Landa Palette
        background: '#050505',    // Deepest black
        surface: '#121212',       // Card background
        primary: '#0070FF',       // Electric Blue (CTA)
        'primary-hover': '#338CFF', // Lighter blue for hover
        secondary: '#505050',     // Neutral elements
        text: {
          main: '#F5F5F7',        // Primary text
          muted: '#A1A1A6',       // Secondary text
          dim: '#6E6E73',         // Tertiary text
        },
        border: 'rgba(255, 255, 255, 0.1)', // Subtle borders
        
        // Aliases for compatibility (mapped to new palette)
        accent: '#0070FF',
        obsidian: {
          bg: '#050505',
          surface: '#121212',
          border: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
        lg: '24px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 112, 255, 0.15)',
        'glow-hover': '0 0 30px rgba(0, 112, 255, 0.25)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
