# docs

Documentation app for the Luke UI design system.

## Commands

```bash
pnpm dev
pnpm build
pnpm check
```

## Deploy modes

Production builds default to Netlify SSR (`DOCS_STATIC` unset): docs HTML is rendered at request
time so theme cookies can vary the first paint. Set `DOCS_STATIC=true` for a fully prerendered
static host (for example GitHub Pages). After an SSR build, `pnpm run check:ssr-nav` checks
client-side navigation between docs pages.
