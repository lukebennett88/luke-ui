import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('docs test failures upload browser attachments without hiding the test failure', async () => {
	const workflow = await readFile(path.join(repoRoot, '.github/workflows/test.yml'), 'utf8');
	const docsJob = workflow.split('  docs-tests:\n')[1]?.split('\n  consumer-tests:')[0];

	expect(docsJob).toMatch(
		/name: Upload docs browser-test screenshots\n\s+if: failure\(\)\n\s+continue-on-error: true/,
	);
	expect(docsJob).toContain('path: apps/docs/.vitest/attachments');
	expect(docsJob).toContain('name: docs-test-failure-screenshots');
	expect(docsJob).toContain('if-no-files-found: ignore');
});
