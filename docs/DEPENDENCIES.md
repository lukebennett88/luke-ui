# Dependencies

This guide explains where dependency versions live, and the workspace rules Renovate has to respect.

## Where versions live

Almost every version lives in the `catalog:` block of `pnpm-workspace.yaml`. Package manifests say
`catalog:` and follow it. `catalogMode: prefer` keeps new dependencies pointing at the catalog.
Renovate updates the catalog entry, so a shared dependency moves once rather than once per package.

Two entries are not plain versions:

- `vite` is an alias for `@voidzero-dev/vite-plus-core`, pinned to the same version as `vite-plus`.
  `overrides` forces one copy of `vite` and `vitest` across the workspace, so they only resolve if
  they move together. Renovate groups them.
- `playwright` is `*`. Renovate cannot upgrade a wildcard and skips it; the version is decided by
  the browser install step in CI.

## The release quarantine

`minimumReleaseAge: 7200` (5 days) stops pnpm resolving any release, direct or transitive, that is
younger than five days. `.github/renovate.json5` sets the same `minimumReleaseAge: '5 days'` so
Renovate never opens a pull request for a release pnpm will refuse to install.

The two settings do not cover the same ground. Renovate's applies to the dependency it is updating.
pnpm's applies to everything the update pulls in. A bump to a five-day-old release can still drag in
a transitive package published yesterday, and the lockfile update then fails.

`trustLockfile: true` means the check is not re-run against entries already in the lockfile, so this
only bites when a lockfile is generated, never on a plain `pnpm install --frozen-lockfile` in CI.

## The exclude lists

`minimumReleaseAgeExclude` and `trustPolicyExclude` stay hand maintained. Renovate has no manager
for these keys; catalog entries are the only part of `pnpm-workspace.yaml` it reads and writes. It
cannot add an entry, and it cannot prune one.

This is the intended release valve. When a pull request fails to install because a version is too
young or trips `trustPolicy: no-downgrade`, add the exact version to the matching list.

Stale entries are inert rather than wrong. Each entry names an exact version, so once that version
is older than the quarantine the exemption grants nothing. Pruning is optional housekeeping: delete
an entry, run `pnpm install`, and keep the deletion if the install succeeds.

`peerDependencyRules`, `overrides`, and `allowBuilds` are hand maintained for the same reason. An
update can make an entry unnecessary or wrong, and only a person reading the failure will notice.

## Changesets

`@luke-ui/react` publishes. `apps/docs` and `@luke-ui/rainbow-sprinkles` are private.

A pull request that moves a runtime or peer dependency of `@luke-ui/react` needs a changeset,
because the published package's own dependency ranges change. Renovate cannot write one. It labels
those pull requests `needs-changeset` instead, using an explicit package list in
`.github/renovate.json5` that has to be kept in step with `dependencies` and `peerDependencies` in
`packages/@luke-ui/react/package.json`.

Development dependency bumps do not need a changeset. Nothing about the published package changes.

`react` and `react-dom` use `rangeStrategy: 'replace'` rather than `bump`, so the catalog range only
widens when the caret stops covering the new version. The catalog range is what gets published as
the peer range, and bumping it on every minor would narrow what consumers can satisfy.

## Grouping and schedule

Renovate runs once a week, before 6am on Monday. Updates are grouped by release train (storybook,
react, react-aria, vanilla-extract, tanstack, fumadocs, tailwindcss, turbo, netlify, capsize, the
vite-plus toolchain) with everything else falling into one `non-major dependencies` pull request.
Majors split into their own pull request per group.

`lockFileMaintenance` runs on the first of the month and refreshes transitive versions, which
nothing else moves.

## Automerge

Only `type definitions` automerges: non-major `@types/*` updates, excluding `@types/react` and
`@types/react-dom`, which have to land with the `react` major they describe. Type packages ship
nothing to consumers, and a bad bump fails `check:types`.

Everything else is merged by hand. Two reasons. Visual regression gates on a manual approval
environment, so a change to rendered output should be looked at. And a share of pull requests need
an exclude list entry before they will install, which no amount of green CI will produce.

## Tooling versions

`mise.toml` pins the Node major. Renovate's `mise` manager tracks it and its node versioning treats
odd majors as unstable, so it will only propose the next LTS line.

The four workflows in `.github/workflows` pin actions at the major tag, so the only update Renovate
can offer is a major tag move. They group into one `github actions` pull request and are never
automerged.

The `packageManager` field in the root `package.json` pins pnpm. Renovate updates it, including the
integrity hash, in its own pull request.
