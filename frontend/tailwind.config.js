/** @type {import('tailwindcss').Config} */
// Token desain: docs/PRD.md §4 (design system "Pelabuhan Digital"). Light mode only, flat (tanpa shadow).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#185FA5', // Maritime Blue — aksi utama, tab aktif
        'primary-dark': '#004782',
        'primary-tint': '#F0F7FF', // baris terpilih, hover, highlight
        accent: '#FF9800', // status Draft / perlu perhatian
        background: '#F8F9FF', // latar halaman
        surface: '#FFFFFF', // kartu/kontainer
        border: '#E2E8F0', // border default
        'border-strong': '#CBD5E1', // border elemen mengambang
        'text-primary': '#0B1C30',
        'text-secondary': '#64748B',
        success: '#16A34A', // status Aktif
        error: '#BA1A1A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // token §4.2 — [size, { lineHeight }]
        'display-lg': ['32px', { lineHeight: '40px', fontWeight: '500' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '500' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '24px' }],
        'body-md': ['14px', { lineHeight: '20px' }],
        'body-sm': ['13px', { lineHeight: '18px' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
      },
      borderRadius: {
        DEFAULT: '8px', // tombol, input, kartu, modal
      },
      boxShadow: {
        // Hanya modal/dialog yang boleh shadow (§4.3)
        modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
    },
  },
  plugins: [],
};
