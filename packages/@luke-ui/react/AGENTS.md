# @luke-ui/react Agent Guide

- Do not hand-edit `.generated/entries.ts` or `package.json` exports; entries are generated, tsdown updates exports at build.
- When adding a component, use `pnpm generate:component` from repo root (not manual file creation) so the group barrel, styles index, and docs are updated correctly.
- Stories (`*.stories.tsx`) are the tests; there are no separate `*.test.tsx` files.
