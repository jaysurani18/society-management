/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        'brand-navy': '#1B2340',        // Deep navy sidebar background
        'brand-navy-hover': '#1E2749',  // Navy hover variant
        'brand-navy-active': '#26315C', // Navy active variant
        'brand-cream': '#FAF8F5',       // Soft warm cream page background
        'brand-gold': '#C5A880',        // Gold/amber accent
        'brand-brick': '#A83232',       // Brick-red destructive accent
        indigo: {
          50: '#F7F5F0',                // Pale cream tint
          100: '#EAE5D8',               // Warm border tint
          200: '#C5A880',               // Gold border accent
          300: '#B8976C',
          400: '#A17E53',
          500: '#1E2749',
          600: '#1B2340',               // Navy primary button
          700: '#151C33',
          800: '#0E1324',
          900: '#070A12',
        }
      },
      spacing: {
        'brand-base': '8px',
        'brand-md': '16px',
        'brand-lg': '24px',
        'brand-xl': '32px',
      },
      borderRadius: {
        'brand-sm': '4px',
        'brand-md': '8px',
        'brand-lg': '12px',
        'brand-xl': '16px',
      },
      boxShadow: {
        'brand-flat': '0 0 0 1px rgba(0, 0, 0, 0.05)',
        'brand-low': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        'brand-med': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
        'brand-high': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
