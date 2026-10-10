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
- `playwright` is `*`. Renovate cannot upgrade a wildcard and skips it. The version is decided by
  the browser install step in CI.

## The release quarantine

`minimumReleaseAge: 4320` is exactly three days. It stops pnpm resolving any release, direct or
transitive, that is younger than three days. `.github/renovate.json5` sets
`minimumReleaseAge: '3 days'`, so Renovate and pnpm use the same three-day quarantine.

The two settings do not cover the same ground. Renovate's applies to the dependency it is updating.
pnpm's applies to everything the update pulls in. A bump to a three-day-old release can still drag
in a transitive package published yesterday, and the lockfile update then fails.

`trustLockfile: true` means the check is not re-run against entries already in the lockfile, so this
only bites when a lockfile is generated, never on a plain `pnpm install --frozen-lockfile` in CI.

## The exclude lists

`minimumReleaseAgeExclude` and `trustPolicyExclude` stay hand maintained. Renovate has no manager
for these keys. Catalog entries are the only part of `pnpm-workspace.yaml` it reads and writes. It
cannot add an entry, and it cannot prune one.

This is the intended release valve. When a pull request fails to install because a version is too
young or trips `trustPolicy: no-downgrade`, add the exact version to the matching list.

Stale entries are inert rather than wrong. Each entry names an exact version, so once that version
is older than the quarantine the exemption grants nothing. Pruning is optional housekeeping: delete
an entry, run `pnpm install`, and keep the deletion if the install succeeds.

`peerDependencyRules`, `overrides`, and `allowBuilds` are hand maintained for the same reason. An
update can make an entry unnecessary or wrong, and only a maintainer reading the failure will
notice.

## Runtime dependencies

Every consumer installs the `dependencies` of `@luke-ui/react`. Declare a package there only when
the published JavaScript or declarations import it. Keep build-time packages in `devDependencies`.
The packed-consumer harness in [TESTING.md](TESTING.md#package-consumption) fails on an undeclared
import or an unused dependency.

Prefer declaring a dependency to bundling it. Bundle one only for a concrete reason, such as
published code that needs a small part of a package whose install would cost consumers far more than
that part. To bundle a dependency, list it in `devDependencies` and in `deps.onlyBundle` in
`packages/@luke-ui/react/vite.config.ts`. The build fails when it bundles a package that
`deps.onlyBundle` does not list. It records each bundled version in `inlinedDependencies` in
`package.json`.

## Changesets

`@luke-ui/react` is unpublished at version `0.0.0`. `@luke-ui/rainbow-sprinkles` is a publishable
0.x support package used by `@luke-ui/react` at runtime. It is not part of the stable Luke UI 1.x
consumer API. Publish it with React whenever React depends on a Rainbow version that is not yet on
the registry. `@luke-ui/theme-paper` and `@luke-ui/theme-tactile` are unpublished 0.x theme packages
with `@luke-ui/react` as a peer dependency. Their final peer ranges belong to
[#721](https://github.com/lukebennett88/luke-ui/issues/721). `apps/docs`,
`@luke-ui/playground-core`, and `@luke-ui/theme-build`, the build the two theme packages share, are
private. Before `1.0.0` no pull request needs a changeset, including one that moves a runtime or
peer dependency.

The `needs-changeset` label in `.github/renovate.json5` is advance notice. It marks packages that
will be runtime, peer, or bundled dependencies of the published package at `1.0.0`. Re-sync that
list against `dependencies`, `peerDependencies`, and `inlinedDependencies` in
`packages/@luke-ui/react/package.json` at `1.0.0`.

`react` and `react-dom` use `rangeStrategy: 'replace'` rather than `bump`, so the catalog range only
widens when the caret stops covering the new version. The catalog range is what gets published as
the peer range, and bumping it on every minor would narrow what consumers can satisfy.

## Grouping and schedule

Renovate runs weekly before 6am on Monday. It groups non-major updates by release train and splits
major updates into separate pull requests.

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

The root `package.json` `packageManager` field pins the exact pnpm version. Omitting the hash avoids
Renovate's Corepack-based hash regeneration.

The root `devEngines.runtime` field pins the project Node runtime, and `onFail: 'download'` makes
pnpm provision it. pnpm resolves the `24.x` range to an exact version and records it in the
lockfile, with a download and integrity hash for each platform.

GitHub Actions sets up tooling with `pnpm/setup`. It installs the pnpm version from `packageManager`
and the Node runtime from `devEngines.runtime`.

A local developer bootstraps by installing pnpm itself. `pnpm install` then downloads the declared
Node runtime and links it as `node_modules/.bin/node`, so `pnpm exec node` and pnpm scripts run it.
Bare `node` is project-aware only when pnpm's global Node shim is the `node` found first on `PATH`.

Cloudflare Pages keeps its host-level `NODE_VERSION=24` setting on the Pages project. Its build
image does not document `devEngines.runtime` as a Node version selector.

Renovate has no manager for `devEngines.runtime`, so `.github/renovate.json5` adds a `custom.regex`
manager for it. The regex captures only the major before `.x`, so an update PR rewrites `24.x` to
the next `<major>.x`. Renovate follows Node's release schedule and only proposes stable LTS lines.

`@types/node` tracks that Node major. Renovate's `allowedVersions: '<25'` blocks newer majors, and
an `overrides` entry forces every copy onto the catalog so optional peers cannot drift. When the
Node major PR lands, update `allowedVersions` and the catalog entry in the same change.

The workflows in `.github/workflows` pin actions at the major tag, so the only update Renovate can
offer is a major tag move. They group into one `github actions` pull request and are never
automerged.
