# Dependencies

## Where versions live

Put versions in the `catalog:` block of `pnpm-workspace.yaml` and write `catalog:` in package
manifests, so Renovate moves a shared dependency once.

Two dependencies have coupled versions:

- `vite` is an alias for `@voidzero-dev/vite-plus-core`, pinned to the same version as `vite-plus`.
  `overrides` forces one copy of `vite` and `vitest` across the workspace, so they only resolve if
  they move together. Renovate groups them.
- `playwright` is pinned to the exact version in the
  [visual test image](VISUAL_TESTING.md#baseline). Renovate groups the npm package and Docker image
  updates in one pull request.

## The release quarantine

pnpm (`minimumReleaseAge: 4320`) and Renovate (`.github/renovate.json5`) both quarantine releases
for three days. Renovate's quarantine covers the dependency it updates. pnpm's covers everything the
update pulls in, so a bump to a three-day-old release can still fail on a transitive package
published yesterday. `trustLockfile: true` skips the check for entries already in the lockfile, so
it fails only when a lockfile is generated, never on `pnpm install --frozen-lockfile`.

## The exclude lists

Renovate edits only catalog entries in `pnpm-workspace.yaml`. Maintain `minimumReleaseAgeExclude`,
`trustPolicyExclude`, `peerDependencyRules`, `overrides`, and `allowBuilds` by hand. An update can
make an entry unnecessary or wrong, and only a maintainer reading the failure will notice.

When a pull request fails to install because a version is too young or fails `trustPolicy`, add the
exact version to the matching exclude list. An exact-version entry grants nothing once that version
is older than the quarantine. To prune one, delete it, run `pnpm install`, and keep the deletion if
the install succeeds.

## Runtime dependencies

Every consumer installs the `dependencies` of `@luke-ui/react`. Declare a package there only when
the published JavaScript or declarations import it. Keep build-time packages in `devDependencies`.
The [packed-consumer harness](TESTING.md#package-consumption) fails on an undeclared import or an
unused dependency. The package audit's decisions are in
[#719](https://github.com/lukebennett88/luke-ui/issues/719).

Declare a dependency rather than bundling it, unless there is a concrete reason, such as needing a
small part of a package whose install would cost consumers far more. To bundle one, list it in
`devDependencies` and in `deps.onlyBundle` in `packages/@luke-ui/react/vite.config.ts`. The build
fails on a bundled package that `deps.onlyBundle` does not list. Commit the `inlinedDependencies`
metadata the packer writes to `package.json`. Paper and Tactile bundle `@capsizecss/metrics` the
same way, in `packages/@luke-ui/theme-build/theme-package.ts`.

## Changesets

Before `@luke-ui/react` 1.0.0, no pull request needs a changeset, including one that moves a runtime
or peer dependency. [#721](https://github.com/lukebennett88/luke-ui/issues/721) owns release
mechanics, the theme packages' final peer ranges, and dependency compatibility.

`@luke-ui/rainbow-sprinkles` is a publishable 0.x runtime support package outside the stable Luke UI
1.x consumer API. Publish it with React whenever React depends on a Rainbow version that is not on
the registry.

## Renovate

Monthly `lockFileMaintenance` is the only update that moves transitive versions.

Only the `type definitions` group automerges. Merge every other Renovate pull request by hand.
Visual regression reports screenshot differences without failing, and some pull requests need an
exclude list entry before they install.

## Tooling versions

- **pnpm:** The root `packageManager` field pins the exact version without a hash, which avoids
  Renovate's Corepack-based hash regeneration. Install pnpm yourself to bootstrap.
- **Node:** The root `devEngines.runtime` caret range is the minimum compatible Node version, not a
  pin of the newest patch. pnpm installs the runtime and links it as `node_modules/.bin/node`, so
  `pnpm exec node` and pnpm scripts use it. Bare `node` may not.
- **Node majors:** Renovate groups Node majors with `@types/node` majors as `node`, but they can
  arrive at different times. The Renovate Node configuration check fails CI until their majors
  agree, so complete a split group by hand. Also update the Cloudflare Pages `NODE_VERSION` setting,
  because Pages ignores `devEngines.runtime`.
