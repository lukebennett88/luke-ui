import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { changedTrackedFiles, snapshotTrackedFiles } from './check.js';

test('checks preserve pre-existing edits while detecting mutations and deletions', () => {
	const cwd = mkdtempSync(join(tmpdir(), 'luke-ui-check-'));
	try {
		execFileSync('git', ['init', '--quiet'], { cwd });
		writeFileSync(join(cwd, 'tracked.ts'), 'initial');
		execFileSync('git', ['add', 'tracked.ts'], { cwd });
		writeFileSync(join(cwd, 'tracked.ts'), 'pre-existing edit');
		const before = snapshotTrackedFiles(cwd);
		writeFileSync(join(cwd, 'staged.ts'), 'staged during the run');
		execFileSync('git', ['add', 'staged.ts'], { cwd });
		expect(changedTrackedFiles(before, snapshotTrackedFiles(cwd))).toEqual([]);
		writeFileSync(join(cwd, 'ignored.txt'), 'untracked output');
		expect(changedTrackedFiles(before, snapshotTrackedFiles(cwd))).toEqual([]);
		writeFileSync(join(cwd, 'tracked.ts'), 'unexpected check mutation');
		expect(changedTrackedFiles(before, snapshotTrackedFiles(cwd))).toEqual(['tracked.ts']);
		rmSync(join(cwd, 'tracked.ts'));
		expect(changedTrackedFiles(before, snapshotTrackedFiles(cwd))).toEqual(['tracked.ts']);
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
});
