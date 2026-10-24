# HLU

React + TypeScript + Vite + MUI + Tailwind CSS starter.

## Scripts

```bash
npm install
npm run start:dev     # start dev server (port 5191)
npm run build         # production build (base /ui/hlu/ for Nest)
npm run build:vc      # production build (base / for Vercel static)
npm run preview       # preview production build
npm run lint          # oxlint
npm run git:push      # push `ui` branch and print commit table
```

On Vercel: Build Command `npm run build:vc`, Output Directory `dist`.

## Stack

- [Vite](https://vite.dev/) 8
- [React](https://react.dev/) 19
- [MUI](https://mui.com/) 9 (`@mui/material`, `@mui/icons-material`)
- [Tailwind CSS](https://tailwindcss.com/) 4 (`@tailwindcss/vite`)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (service worker + web manifest)
- Emotion (`@emotion/react`, `@emotion/styled`)

App entry wraps the tree with `BrowserRouter`, `ThemeProvider`, `CssBaseline`, and shared providers in `src/main.tsx`.

Tailwind preflight is disabled so it does not fight MUI’s `CssBaseline`. Use utility classes via `className` alongside MUI `sx` / components.

## `src` layout

Same structure as DHAMMA_JUNGLE_UI:

```
src/
  components/ handlers/ hooks/ interfaces/ layouts/
  pages/ providers/ resources/ tools/
  app.tsx  main.tsx  config.ts  styles.css
```

## Conventions

- Filenames: lowercase train-case (kebab-case), e.g. `app.tsx`, `user-card.tsx`.
