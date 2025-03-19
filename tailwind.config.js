module.exports = {
  content: ['./**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        primary: '#1a365d',    // Navy blue
        secondary: '#2b4c7e',  // Lighter navy
        accent: '#3b82f6',     // Bright blue
        textPrimary: '#1f2937',
        textSecondary: '#4b5563',
        bgLight: '#f3f4f6',
        bgDark: '#111827'
      },
      fontFamily: {
        'sans': ['Josefin Sans', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.7s ease-out',
        'bounce-slow': 'bounce-slow 3s ease-in-out infinite'
      }
    }
  },
  plugins: [],
} 