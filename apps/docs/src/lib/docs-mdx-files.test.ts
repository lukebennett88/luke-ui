import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, expect, test } from 'vite-plus/test';
import { findMdxFiles } from './docs-mdx-files.js';

const testDirectories: Array<string> = [];

afterEach(() => {
	for (const directory of testDirectories) {
		rmSync(directory, { force: true, recursive: true });
	}
	testDirectories.length = 0;
});

test('walks nested .mdx files and skips other extensions', () => {
	const directory = mkdtempSync(join(tmpdir(), 'luke-ui-docs-mdx-files-'));
	testDirectories.push(directory);
	mkdirSync(join(directory, 'components', 'actions'), { recursive: true });
	writeFileSync(join(directory, 'index.mdx'), '# Home\n');
	writeFileSync(join(directory, 'components', 'actions', 'button.mdx'), '# Button\n');
	writeFileSync(join(directory, 'components', 'actions', 'notes.txt'), 'skip\n');

	expect(
		findMdxFiles(directory)
			.map((file) => basename(file))
			.sort(),
	).toEqual(['button.mdx', 'index.mdx']);
});
