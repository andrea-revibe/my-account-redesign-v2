/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Graphik', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: 'rgb(28, 34, 48)',
          2: 'rgb(75, 82, 96)',
        },
        muted: 'rgb(138, 143, 154)',
        line: {
          DEFAULT: 'rgb(230, 227, 236)',
          2: 'rgb(241, 238, 245)',
        },
        brand: {
          DEFAULT: 'rgb(80, 25, 160)',
          2: 'rgb(122, 61, 211)',
          link: 'rgb(26, 13, 171)',
          bg: 'rgb(243, 237, 251)',
          bg2: 'rgb(236, 226, 250)',
        },
        accent: 'rgb(217, 26, 122)',
        success: {
          DEFAULT: 'rgb(0, 150, 106)',
          bg: 'rgb(230, 246, 240)',
        },
        warn: {
          DEFAULT: 'rgb(196, 105, 0)',
          bg: 'rgb(255, 242, 221)',
        },
        danger: {
          DEFAULT: 'rgb(200, 36, 58)',
          bg: 'rgb(253, 232, 235)',
        },
        progress: 'rgb(255, 153, 31)',
        chip: {
          warn: 'rgb(255, 213, 153)',
          warnInk: 'rgb(180, 95, 6)',
          danger: 'rgb(220, 38, 38)',
        },
        surface: '#FFFFFF',
        canvas: 'rgb(247, 245, 251)',
        searchBg: 'rgb(244, 240, 250)',
      },
      fontSize: {
        body: ['14px', '20px'],
        small: ['12px', '16px'],
        section: ['14px', '20px'],
      },
      borderRadius: {
        card: '18px',
        btn: '10px',
      },
      maxWidth: {
        mobile: '430px',
      },
      backgroundImage: {
        'hero-gradient':
          'linear-gradient(155deg, #2a0f5b 0%, #5019a0 50%, #7a3dd3 100%)',
        'credits-pill':
          'linear-gradient(95deg, rgb(80, 25, 160) 0%, rgb(217, 26, 122) 100%)',
      },
      boxShadow: {
        sm2: '0 1px 2px rgba(20, 12, 40, 0.04)',
        md2: '0 6px 16px -8px rgba(20, 12, 40, 0.12), 0 2px 4px rgba(20, 12, 40, 0.04)',
        lg2: '0 16px 40px -12px rgba(80, 25, 160, 0.18), 0 4px 12px rgba(20, 12, 40, 0.06)',
      },
      keyframes: {
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        heroPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(109,255,184,0.6)' },
          '100%': { boxShadow: '0 0 0 10px rgba(109,255,184,0)' },
        },
      },
      animation: {
        slideDown: 'slideDown 0.3s ease',
        heroPulse: 'heroPulse 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
}
