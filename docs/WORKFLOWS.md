# Repository workflows

Run commands from the repository root after `pnpm install`. Installation sets up dependencies
without generating application files. The task graph prepares generated files and workspace builds
for build, check, test, and development commands.

Run `pnpm generate` to prepare generated editor inputs before opening an otherwise unbuilt checkout.
The app development commands prepare them automatically.

## Commands

| Command                                    | Scope                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm build`                               | All packages and both apps                                                                                                         |
| `pnpm build:packages`                      | Workspace libraries                                                                                                                |
| `pnpm build:docs`                          | Docs production output and output validation                                                                                       |
| `pnpm build:reference-app`                 | Reference app production output                                                                                                    |
| `pnpm check`                               | Format, ordinary and type-aware lint, every TypeScript project, barrels, docs, generated site validations, cycles, and unused code |
| `pnpm check:format`                        | Repository formatting                                                                                                              |
| `pnpm check:lint`                          | Ordinary repository lint                                                                                                           |
| `pnpm check:lint:types`                    | Scoped type-aware lint                                                                                                             |
| `pnpm check:types`                         | Workspace TypeScript projects                                                                                                      |
| `pnpm check:cycles` / `pnpm check:unused`  | Repository-wide graph checks                                                                                                       |
| `pnpm dev:docs` / `pnpm dev:reference-app` | App development with workspace changes                                                                                             |

The comprehensive check runs `vp check` once for repository formatting and ordinary lint, then runs
explicit TypeScript projects, type-aware lint, generated-file validations, barrels, cycles, and
unused-code checks through Turbo. Scoped `--type-aware` lint tasks reuse the root configuration and
run only semantic rules. It may refresh ignored generated files and caches but does not run fixers.
CI checks for tracked-file changes after the command completes.

Focused workspace tasks use the same graph, for example:

```sh
pnpm exec turbo run build --filter=@luke-ui/react
pnpm exec turbo run check:types --filter=docs
pnpm exec turbo run test --filter=reference-app
```

Package scripts contain discrete operations. Use Turbo when an operation needs generated files or
dependency builds. A direct `pnpm --filter … run …` invokes only that package script.

`pnpm test` runs every suite, including packed consumers, theme integration, and the Docker visual
comparison. It runs one workspace test task at a time because Vitest already parallelises within
each suite. CI splits the suites across isolated jobs.

See [Testing](TESTING.md) for test contracts, [Visual testing](VISUAL_TESTING.md) for Docker and
baseline requirements, and [Components](COMPONENTS.md) for scaffolding arguments.

## Fixing and cleaning

`pnpm fix` applies repository lint fixes, then scoped type-aware fixes, then repository formatting.
Each file receives ordinary fixes and formatting once. `pnpm fix:unsafe` also applies lint
suggestions, dangerous lint fixes, and Knip fixes. Review the diff after either command. Read-only
checks never apply fixes. Mutating tasks are never cached.

`pnpm clean:build` removes known build and generated outputs while retaining dependencies.
`pnpm clean` also removes known tool caches and workspace dependencies. The cleanup script limits
removal to these known paths. Turbo and pnpm do not provide dependency cleanup, and broad Git
cleanup would also remove local settings.

`pnpm clean:unsafe` opens Git's interactive ignored-file cleanup. Review the listed paths before
choosing `clean`. The list includes ignored `.env` files and local settings.

## Task runner

Turbo owns dependency ordering, caching, and companion processes in `turbo.json`. Root scripts are
the public interface. Package scripts own the operations. Deterministic builds and derived
generation can reuse task outputs. Tests always execute, as do watchers, fixers, and cleanup. Checks
are read-only and are not cached when they cover repository-wide inputs.

Generator watch scripts use `tsx watch --include` for non-code inputs such as Markdown, SVG, package
manifests, and workspace build outputs. Directory inputs also detect new and removed files. They
avoid the installed tsx glob watcher's memory growth during repeated package rebuilds. The types
watcher observes the whole build directory, so runtime-only rebuilds can also regenerate its map.
Each companion watches the inputs for its generated output. Turbo's `with` relationship starts and
stops these package watchers with the app. Existing Vite/Rolldown plugins also watch the built theme
compiler and reload it for stylesheet regeneration, without another companion process.

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
