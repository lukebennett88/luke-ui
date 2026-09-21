// Fails the Visual baseline job when the capture step rendered nothing, so an
// empty artefact is never published as a baseline for later PRs to compare
// against. Replaces the inline `find … | wc -l` check.

import path from 'node:path';
import * as core from '@actions/core';
import { countPngs } from './count-pngs.js';
import { fromRepoRoot, VISUAL_BASELINE_DIR } from './repo-paths.js';

const configured = process.env.VISUAL_CAPTURE_DIR?.trim();
const directory = configured ? path.resolve(configured) : fromRepoRoot(VISUAL_BASELINE_DIR);

const count = await countPngs(directory);
core.info(`Captured ${count} baseline screenshots in ${directory}.`);

if (count === 0) {
	core.setFailed(
		'No visual captures were rendered, so the baseline would be empty. Check the capture step above for a failure before publishing this baseline.',
	);
}
