/* eslint-disable no-console -- A command-line script: it reports to the terminal and runs builds and browser steps one at a time. */
// Packs the workspace builds of the current Vanilla Extract packages into `vendor/`, so the
// VE consumers install them as tarballs, the way a real consumer would. Run `pnpm run
// build:packages` at the repository root first.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const spikeRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = join(spikeRoot, '..', '..');
const vendor = join(spikeRoot, 'vendor');
rmSync(vendor, { force: true, recursive: true });
mkdirSync(vendor);

const packages = ['rainbow-sprinkles', 'react', 'theme-tactile', 'theme-paper'];
for (const name of packages) {
	const dir = join(repoRoot, 'packages', '@luke-ui', name);
	execFileSync('pnpm', ['pack', '--pack-destination', vendor], { cwd: dir, stdio: 'inherit' });
}
// Stable names, so consumer manifests do not change when the version does.
for (const file of readdirSync(vendor)) {
	const match = /^luke-ui-(.+)-\d+\.\d+\.\d+.*\.tgz$/.exec(file);
	if (match) renameSync(join(vendor, file), join(vendor, `luke-ui-${match[1]}.tgz`));
}
console.log(readdirSync(vendor).join('\n'));

// The StyleX consumers reuse the generated theme CSS unchanged, without installing the VE package
// the theme packages declare as a peer.
mkdirSync(join(vendor, 'themes'));
for (const theme of ['tactile', 'paper']) {
	const css = execFileSync('tar', [
		'-xzOf',
		join(vendor, `luke-ui-theme-${theme}.tgz`),
		'package/dist/stylesheet.css',
	]);
	writeFileSync(join(vendor, 'themes', `${theme}.css`), css);
}
