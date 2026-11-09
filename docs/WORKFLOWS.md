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
| `pnpm lint:changed`                        | Lint JS/TS files changed since `origin/main` (run `git add` on new files first)                                                    |
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

Run tests, type checks, and dev servers through Turbo from the repository root. A package-local
`vp test`, `vp dev`, or `tsc` reads whatever `dist` and generated files already exist. After a
source edit, browser tests and the docs app then run against a stale build, and a fresh worktree has
no generated files at all. To run one file or directory, pass it after `--`:

```sh
pnpm exec turbo run test:browser:run --filter=@luke-ui/react -- src/core/visually-hidden
pnpm exec turbo run test --filter=docs -- src/components/search.browser.test.tsx
```

`pnpm test` runs every suite, including packed consumers, theme integration, and the Docker visual
comparison. `pnpm test:code` runs the same suites without the visual comparison, so it needs no
Docker. Both run one workspace test task at a time because Vitest already parallelises within each
suite. CI splits the suites across isolated jobs.

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

Vite+ supplies the compiler, formatter, linter, packer, and test tool. Turbo's
[`with` relationship](https://turborepo.dev/docs/reference/configuration#with) manages persistent
companion tasks for development and watch tests while preserving prerequisite ordering.

No remote task cache is required. Runner caching is separate from Vitest, lint, package-manager, and
Docker dependency caches. An internal tool cache must never substitute for required test execution.

## Reading CI

`gh pr checks <number> --json name,state,link` lists each job. The job ID is the number after
`/job/` in its link. `gh run view --log-failed` refuses to print anything until the whole run
completes, so read a finished job inside a running workflow through the API:

```sh
log=$(mktemp)
gh api --allow-escape-sequences "repos/{owner}/{repo}/actions/jobs/<job-id>/logs" \
  | perl -CS -pe 's/\e\[[0-9;]*m//g; s/(?![\t\n])\p{Cc}//g' > "$log"
grep -nE 'FAIL|×|Error' "$log"
```

Run it inside the checkout so `gh` fills in `{owner}/{repo}`. Without `--allow-escape-sequences`,
`gh api` prints only a warning, because the log contains colour codes. The flag also lets through
escape sequences that could control your terminal, so the `perl` step strips colour codes and other
control characters before anything prints. The log is available once that job finishes, even while
other jobs still run.

The visual `compare` job passes when captures differ. Read its summary before you call visual
verification done:

```sh
grep -E ' unchanged$|^[^ ]+ +(changed|added|removed)[[:space:]]' "$log"
```

The summary has the form `N changed, N added, N removed, N unchanged`. Each differing capture
follows on its own line. See [Review](VISUAL_TESTING.md#review) for the diff artefact.

## Shell commands

Agents and contributors run commands in bash or zsh. Write shared commands that behave the same in
both:

- Quote globs and query expressions, as in `--include='*.ts'` and `-q '.sha[0:8]'`. zsh stops with
  "no matches found" when an unquoted glob matches no file. `git grep` avoids the glob entirely.
- Quote variables. bash splits an unquoted variable into words and zsh does not. Pass file lists
  NUL-delimited, as in `git diff -z --name-only | xargs -0 -r pnpm exec vp fmt`, so a filename with
  a space stays one argument. `-r` skips the command when the list is empty. Without it, GNU `xargs`
  runs `vp fmt` with no files, which formats the whole repository.
- Use `perl -pi -e` or a Node script for in-place edits. BSD `sed -i` on macOS requires an argument
  that GNU `sed` rejects.
