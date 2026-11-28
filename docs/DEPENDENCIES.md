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
[research/719-package-release-audit.md](../research/719-package-release-audit.md).

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

The `needs-changeset` label in `.github/renovate.json5` marks future runtime, peer, and bundled
dependencies of `@luke-ui/react`. At 1.0.0, re-sync it against `dependencies`, `peerDependencies`,
and `inlinedDependencies` in `packages/@luke-ui/react/package.json`.

### Published-change versioning

After React 1.0:

- Add a changeset for every release-worthy change to a published package, including 0.x packages.
  Private-only changes with no published impact need no release.
- Describe every intentional change to published visuals in release notes, even a small refinement.
- Version only the affected published packages, including those whose compiled theme CSS changed.

Classify changes to stable (1.x+) packages by consumer impact:

- **Major:** Remove or rename a public token, prop, or theme option. Break documented behaviour or a
  documented guarantee. Make a previously compiling, supported theme fail compilation, including
  through stricter validation for accessibility.
- **Minor:** Add a compatible public token, prop, or optional theme authoring option. Deliberately
  change a theme's overall look or several component families.
- **Patch:** Fix a non-breaking defect, including an accessibility bug or an implementation that
  contradicts its documented contract. Make a narrow visual refinement, including a small
  generated-colour change. Enforcing an existing, explicit guarantee can be a patch when accepting
  the violation was a defect.

Semantic tokens guarantee public names, meanings, documented behaviour, and theme compatibility, not
exact generated colour values. Classify a repaint by its published impact. A change to private code
is breaking when it violates a public contract.

For 0.x packages, breaking changes, new public capabilities, and broad visual redesigns are minor.
Fixes and narrow visual refinements are patches.

## Renovate

Monthly `lockFileMaintenance` is the only update that moves transitive versions.

Only the `type definitions` group automerges. Merge every other Renovate pull request by hand.
Visual regression reports screenshot differences without failing, and some pull requests need an
exclude list entry before they install.

## Tooling versions

- **pnpm:** The root `packageManager` field pins the exact version without a hash, which avoids
  Renovate's Corepack-based hash regeneration. Install pnpm yourself to bootstrap.
- **Node:** The root `devEngines.runtime` field declares the supported Node major as a caret range,
  with `onFail: 'download'`. The range is the minimum compatible version, not a pin of the newest
  patch. A newer release in the same major does not by itself justify raising it. pnpm records the
  exact runtime in the lockfile (`node@runtime:…`) and links it as `node_modules/.bin/node`, so
  `pnpm exec node` and pnpm scripts run it. Bare `node` runs it only when pnpm's global Node shim is
  first on `PATH`.
- **GitHub Actions:** `pnpm/setup` reads both fields. `actions/setup-node` reads
  `devEngines.runtime` through `node-version-file: package.json`. Workflows need no separate pin.
- **Renovate:** Node majors group with `@types/node` majors as `node`. The two can arrive at
  different times, and the Renovate Node configuration check fails CI until their majors agree, so
  complete a split group by hand.
- **Other tools:** Taze and similar tools may raise a caret range's lower bound when they bump Node.
  Exclude Node from a routine sweep that should not change the minimum, for example with an ignore
  on `taze major -w`.
- **Cloudflare Pages:** Pages selects Node through `NODE_VERSION`, `.nvmrc`, or `.node-version`, not
  `devEngines.runtime`, and must bootstrap pnpm before pnpm installs the runtime. The Pages project
  sets `NODE_VERSION`. Update it when the Node major changes, until a preview with the setting
  removed shows the build image default installs and builds with the right pnpm and Node versions.
  Add no version file to the repository.

For a Node major upgrade, review the type update, lockfile, and Cloudflare preview and host setting.
When validating a newer Renovate release, update the pinned version in
`.github/workflows/renovate-node.yml`.
