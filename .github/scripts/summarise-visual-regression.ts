// Turns `summary.json` into the job summary table and the `review` step output
// the downstream review job gates on. Replaces the inline `jq` block.

import * as core from '@actions/core';
import { readFile } from 'node:fs/promises';
import { fromRepoRoot, VISUAL_SUMMARY_FILE } from './repo-paths.js';
import { countRequiringReview, countsTableRows } from './visual-baseline-run.js';
import type { VisualSummary } from './visual-summary-types.js';

const summaryPath = fromRepoRoot(VISUAL_SUMMARY_FILE);
const summary: VisualSummary = JSON.parse(await readFile(summaryPath, 'utf8'));

await core.summary
	.addHeading('Visual regression', 3)
	.addTable([
		[
			{ data: 'status', header: true },
			{ data: 'count', header: true },
		],
		...countsTableRows(summary.counts).map(([status, count]) => [status, count]),
	])
	.write();

const review = countRequiringReview(summary.counts);
core.setOutput('review', review);

const needingReview = summary.results.filter((result) => result.status !== 'unchanged');
if (needingReview.length === 0) {
	core.info('No visual changes.');
} else {
	core.info(`${review} capture(s) need review:`);
	for (const result of needingReview) {
		core.info(`  ${result.status}\t${result.id}`);
	}
}
