/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        graphite: "rgb(var(--color-graphite) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        signal: "rgb(var(--color-signal) / <alpha-value>)",
        mint: "rgb(var(--color-mint) / <alpha-value>)",
        coral: "rgb(var(--color-coral) / <alpha-value>)",
        amber: "rgb(var(--color-amber) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        lilac: "rgb(var(--color-lilac) / <alpha-value>)",
        peach: "rgb(var(--color-peach) / <alpha-value>)",
        glass: "rgb(var(--color-glass) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 20px 60px rgb(var(--shadow-soft) / 0.18)",
        card: "0 14px 40px rgb(var(--shadow-soft) / 0.14)",
        glow: "0 24px 80px rgb(var(--color-signal) / 0.28)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};
