<!-- intent-skills:start -->
# Skill mappings - load `use` with `pnpm dlx @tanstack/intent@latest load <use>`.
skills:
  - when: "Migrate an existing Vite app using @cloudflare/vite-plugin to Vite + void. Use when a project already runs on Cloudflare Workers but needs Void file-based routes, inferred bindings, and void deploy workflow."
    use: "void#migrate-cloudflare-to-void"
  - when: "Void skill for app development and CLI operations. Use this skill to route user requests to the appropriate bundled Void docs."
    use: "void#void"
<!-- intent-skills:end -->

# Luke UI Agent Guide

- Use `catalog:` in `package.json` for dependency versions (catalog in `pnpm-workspace.yaml`). Do not add raw versions.
- See [docs/CONVENTIONS.md](docs/CONVENTIONS.md), [docs/STYLING.md](docs/STYLING.md) for conventions and styling.
