# Repository workflows

Run commands from the repository root after `pnpm install`. Installation sets up dependencies
without generating application files. The task graph prepares generated files and workspace builds
for build, check, test, and development commands.

Run `pnpm generate` to prepare generated editor inputs before opening an otherwise unbuilt checkout.
The app development commands prepare them automatically.

## Commands

| Command                                               | Scope                                                                                                                              |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm build`                                          | All packages and both apps                                                                                                         |
| `pnpm build:packages`                                 | Workspace libraries                                                                                                                |
| `pnpm build:docs`                                     | Docs production output and output validation                                                                                       |
| `pnpm build:reference-app`                            | Reference app production output                                                                                                    |
| `pnpm check`                                          | Format, ordinary and type-aware lint, every TypeScript project, barrels, docs, generated site validations, cycles, and unused code |
| `pnpm check:format`                                   | Repository formatting                                                                                                              |
| `pnpm check:lint`                                     | Ordinary repository lint                                                                                                           |
| `pnpm check:lint:types`                               | Scoped type-aware lint                                                                                                             |
| `pnpm check:types`                                    | Workspace TypeScript projects                                                                                                      |
| `pnpm check:cycles` / `pnpm check:unused`             | Repository-wide graph checks                                                                                                       |
| `pnpm test`                                           | All suites, including packed consumers, theme integration, apps, tooling, and authoritative visual comparison                      |
| `pnpm test:unit` / `pnpm test:browser`                | Focused React suites                                                                                                               |
| `pnpm test:consumer` / `pnpm test:integration`        | Packed consumers or theme build watcher                                                                                            |
| `pnpm test:docs` / `pnpm test:reference-app`          | App suites                                                                                                                         |
| `pnpm test:visual`                                    | Authoritative Docker comparison                                                                                                    |
| `pnpm test:visual:host`                               | Non-authoritative host comparison                                                                                                  |
| `pnpm dev:docs` / `pnpm dev:reference-app`            | App development with workspace changes                                                                                             |
| `pnpm scaffold:component` / `pnpm scaffold:primitive` | Create authored source files                                                                                                       |

The comprehensive check uses root `vp check` for ordinary lint and formatting. TypeScript checks
remain explicit. Type-aware lint has separate package tasks so it retains diagnostics that ordinary
lint and TypeScript compilation do not provide. Checks may write ignored generated files and caches,
but must preserve tracked files. The check entry point detects tracked-file changes.

Focused workspace tasks use the same graph, for example:

```sh
pnpm exec turbo run build --filter=@luke-ui/react
pnpm exec turbo run check:types --filter=docs
pnpm exec turbo run test --filter=reference-app
```

Package scripts contain discrete operations. Use Turbo when an operation needs generated files or
dependency builds. A direct `pnpm --filter … run …` invokes only that package script.

See [Testing](TESTING.md) for test contracts, [Visual testing](VISUAL_TESTING.md) for Docker and
baseline requirements, and [Components](COMPONENTS.md) for scaffolding arguments.

## Fixing and cleaning

`pnpm fix` applies safe lint fixes before formatting. `pnpm fix:unsafe` also applies lint
suggestions, dangerous lint fixes, and Knip fixes. Review the diff after either command. Read-only
checks never apply fixes. Mutating tasks are never cached.

`pnpm clean:build` removes known build and generated outputs while retaining dependencies.
`pnpm clean` also removes known tool caches and workspace dependencies. Neither command uses
`git clean` or removes arbitrary ignored files.

`pnpm clean:unsafe` opens Git's interactive ignored-file cleanup. Review the listed paths before
choosing `clean`. The list includes ignored `.env` files and local settings.

## Task runner

Turbo owns dependency ordering, caching, and companion processes in `turbo.json`. Root scripts are
the public interface. Package scripts own the operations. Deterministic builds and derived
generation can reuse task outputs. Tests always execute, as do watchers, fixers, scaffolding, and
cleanup. Root-wide checks must hash repository-wide inputs when cached.

Generator watch scripts use `tsx watch --include` for non-code inputs such as Markdown, SVG, package
manifests, and workspace build outputs. Each companion watches only the inputs for its generated
output, so an unrelated edit does not rerun every docs generator. Turbo's `with` relationship starts
and stops these package watchers with the app.

Vite+ remains the compiler, formatter, linter, packer, and test tool. Its task runner was evaluated
against the installed version rather than selected from script counts. The
[Vite+ run documentation](https://viteplus.dev/guide/run) supports script execution, explicit task
dependencies, automatic cache tracking, and workspace ordering. The
[Void configuration](https://github.com/voidzero-dev/void/blob/main/vite.config.ts) provides a
useful hybrid pattern: discrete scripts remain in package manifests, with task definitions for
dependencies and caching.

The migration blocker is persistent companion tasks. A representative two-package workspace with a
long-running library `dev` dependency never starts the app under `vp run -r dev`: topological
execution waits for the dependency to exit. `--parallel` starts both processes but discards the
prerequisite ordering. The installed Vite+ task schema provides no persistent companion relationship
equivalent to [Turbo's `with`](https://turborepo.dev/docs/reference/configuration#with). Retaining
Turbo avoids a custom process supervisor and preserves the development and watch-test lifecycle.

No remote task cache is required. Runner caching is separate from Vitest, lint, package-manager, and
Docker dependency caches. An internal tool cache must never substitute for required test execution.
