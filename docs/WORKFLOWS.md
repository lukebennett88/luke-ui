# Repository workflows

Run commands from the repository root after `pnpm install`. Installation generates no application
files. The task graph prepares generated files and workspace builds for build, check, test, and
development commands. Run `pnpm generate` before opening an unbuilt checkout in an editor.

## Commands

Root scripts in `package.json` are the public interface. These need more than their names:

| Command             | Notes                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`        | The full read-only check. It may refresh ignored generated files and caches but runs no fixers. CI then checks for tracked-file changes |
| `pnpm lint:changed` | Lints JS/TS files changed since `origin/main`. It skips untracked files, so run `git add` on new files first                            |
| `pnpm test`         | Every suite, including packed consumers, theme integration, and the Docker visual comparison                                            |
| `pnpm test:code`    | The same suites without the visual comparison, so it needs no Docker                                                                    |
| `pnpm dev:squint`   | Visual review app, serving the local comparison at `?source=local`                                                                      |

`pnpm test` and `pnpm test:code` run one workspace test task at a time because Vitest already
parallelises within each suite.

Run tests, type checks, and dev servers through Turbo from the repository root. A package-local
`vp test`, `vp dev`, `tsc`, or `pnpm --filter … run …` runs only that package script against
whatever `dist` and generated files already exist. After a source edit, browser tests and the docs
app then run against a stale build, and a fresh worktree has no generated files at all. Pass a file
or directory after `--` to run it alone:

```sh
pnpm exec turbo run build --filter=@luke-ui/react
pnpm exec turbo run check:types --filter=docs
pnpm exec turbo run test:browser:run --filter=@luke-ui/react -- src/core/visually-hidden
pnpm exec turbo run test --filter=docs -- src/components/search.browser.test.tsx
```

## Hooks, fixers, and cleanup

- The pre-commit hook runs `vp staged --no-stash`, because every Git worktree shares one stash. When
  `core.hooksPath` already points elsewhere, `vp config` leaves it alone, so run
  `pnpm exec vp hooks enable`.
- Review the diff after `pnpm fix` or `pnpm fix:unsafe`.
- Use `pnpm clean:build` or `pnpm clean` instead of broad Git cleanup. `pnpm clean:unsafe` lists
  ignored `.env` files and local settings, so review the paths before choosing `clean`.
- Generator watch scripts use `tsx watch --include` for non-code inputs, because the tsx glob
  watcher grows in memory during repeated rebuilds.

## Reading CI

`gh pr checks <number> --json name,state,link` lists each job. The job ID is the number after
`/job/` in its link. `gh run view --log-failed` prints nothing until the whole run completes, so
read a finished job inside a running workflow through the API:

```sh
log=$(mktemp)
gh api --allow-escape-sequences "repos/{owner}/{repo}/actions/jobs/<job-id>/logs" \
  | perl -CS -pe 's/\e\[[0-9;]*m//g; s/(?![\t\n])\p{Cc}//g' > "$log"
grep -nE 'FAIL|×|Error' "$log"
```

Run it inside the checkout so `gh` fills in `{owner}/{repo}`. The log contains colour codes, so
`gh api` prints only a warning without `--allow-escape-sequences`. That flag also lets through
sequences that could control your terminal, so the `perl` step strips colour codes and other control
characters before anything prints.

The visual `compare` job passes when captures differ. Read its summary before you call visual
verification done:

```sh
grep -E ' unchanged$|^[^ ]+ +(changed|added|removed)[[:space:]]' "$log"
```

The summary has the form `N changed, N added, N removed, N unchanged`, followed by one line per
differing capture. See [Review](VISUAL_TESTING.md#review) for the diff artefact.

## Shell commands

Write shared commands that behave the same in bash and zsh:

- Quote globs and query expressions, as in `--include='*.ts'` and `-q '.sha[0:8]'`. zsh stops with
  "no matches found" when an unquoted glob matches no file. `git grep` avoids the glob entirely.
- Quote variables. bash splits an unquoted variable into words and zsh does not. Pass file lists
  NUL-delimited, as in `git diff -z --name-only | xargs -0 -r pnpm exec vp fmt`, so a filename with
  a space stays one argument. `-r` skips the command when the list is empty. Without it, GNU `xargs`
  runs `vp fmt` with no files, which formats the whole repository.
- Use `perl -pi -e` or a Node script for in-place edits. BSD `sed -i` on macOS requires an argument
  that GNU `sed` rejects.
