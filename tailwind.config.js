/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Anti-glare matte architectural palette
        'matte-stone': '#E2DCD5',
        'matte-light': '#ECE7E1',
        'matte-mid': '#E0DAD2',
        'matte-dark': '#D4CDC3',
        'matte-surface': '#EDE8E1',
        // Text colors
        'deep-obsidian': '#1F1D1A',
        'soft-espresso': '#54504A',
        // Wood & brass highlights
        'burnished-walnut': '#8C6D48',
        'walnut-dark': '#775A38',
        'wood-warm': '#9E7B56',
        'brass-light': '#B38E5B',
        // Existing colors (keep for compatibility)
        greige: {
          base: '#EAE6DF',
          light: '#F0ECE1',
          warm: '#F5F2EB',
        },
        espresso: '#22201E',
        'warm-slate': '#66625C',
        alabaster: '#FAF8F5',
        oat: '#F2EDE4',
        linen: '#F5EFEB',
        obsidian: '#18181B',
        slate: '#52525B',
        brass: '#B88E52',
        teak: '#A3704C',
        cream: '#FAF8F5',
        gold: '#B88E52',
        charcoal: '#18181B',
        muted: '#52525B',
      },
      boxShadow: {
        studio: '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
        'studio-lg': '0 30px 60px -15px rgba(0, 0, 0, 0.08)',
        glass: '0 8px 32px rgba(24, 24, 27, 0.06)',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
