/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cecytem: {
          purple: {
            light: '#a855f7',   // Púrpura brillante para estados hover y botones secundarios
            DEFAULT: '#581c87', // Púrpura institucional principal
            dark: '#3b0764',    // Púrpura profundo para barras de navegación y acentos
          },
          black: '#111827',     // Negro profundo / Gris oscuro profesional para texto y UI oscura
          white: '#f9fafb',     // Blanco limpio institucional para fondos generales
          gray: '#e5e7eb',      // Gris sutil para bordes de tablas y separadores
        }
      }
    },
  },
  plugins: [],
}