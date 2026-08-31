import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vite-plus/test';
import { cleanGeneratedPropsPages } from './clean-generated-props-pages.js';

const testDirectories: Array<string> = [];

afterEach(() => {
	for (const directory of testDirectories) {
		rmSync(directory, { force: true, recursive: true });
	}
	testDirectories.length = 0;
});

function createTempDir(): string {
	const directory = mkdtempSync(join(tmpdir(), 'luke-ui-clean-generated-props-'));
	testDirectories.push(directory);
	return directory;
}

test('removes generator-owned props.mdx and meta.json and the now-empty directory', () => {
	const root = createTempDir();
	const componentDir = join(root, 'actions', 'button');
	mkdirSync(componentDir, { recursive: true });
	writeFileSync(join(componentDir, 'props.mdx'), '# stale');
	writeFileSync(join(componentDir, 'meta.json'), '{}');

	const result = cleanGeneratedPropsPages(root);

	expect(result.removedCount).toBe(2);
	expect(existsSync(componentDir)).toBe(false);
});

test('does not remove a component directory that still contains an unrelated file', () => {
	const root = createTempDir();
	const componentDir = join(root, 'actions', 'button');
	mkdirSync(componentDir, { recursive: true });
	writeFileSync(join(componentDir, 'props.mdx'), '# stale');
	writeFileSync(join(componentDir, 'notes.txt'), 'keep me');

	const result = cleanGeneratedPropsPages(root);

	expect(result.removedCount).toBe(1);
	expect(existsSync(componentDir)).toBe(true);
	expect(existsSync(join(componentDir, 'props.mdx'))).toBe(false);
	expect(existsSync(join(componentDir, 'notes.txt'))).toBe(true);
	expect(readFileSync(join(componentDir, 'notes.txt'), 'utf8')).toBe('keep me');
});

test('leaves authored guides and group-level meta.json untouched', () => {
	const root = createTempDir();
	const groupDir = join(root, 'actions');
	const componentDir = join(groupDir, 'button');
	mkdirSync(componentDir, { recursive: true });
	writeFileSync(join(groupDir, 'button.mdx'), '# Button guide');
	writeFileSync(join(groupDir, 'meta.json'), '{"pages": ["button"]}');
	writeFileSync(join(componentDir, 'props.mdx'), '# stale');
	writeFileSync(join(componentDir, 'meta.json'), '{}');

	const result = cleanGeneratedPropsPages(root);

	expect(result.removedCount).toBe(2);
	expect(existsSync(componentDir)).toBe(false);
	expect(existsSync(join(groupDir, 'button.mdx'))).toBe(true);
	expect(readFileSync(join(groupDir, 'button.mdx'), 'utf8')).toBe('# Button guide');
	expect(existsSync(join(groupDir, 'meta.json'))).toBe(true);
	expect(readFileSync(join(groupDir, 'meta.json'), 'utf8')).toBe('{"pages": ["button"]}');
});

test('is a no-op when the components directory does not exist', () => {
	const root = createTempDir();

	const result = cleanGeneratedPropsPages(join(root, 'does-not-exist'));

	expect(result.removedCount).toBe(0);
});

test('is a no-op when a group subdirectory has no component directories', () => {
	const root = createTempDir();
	mkdirSync(join(root, 'actions'), { recursive: true });
	writeFileSync(join(root, 'actions', 'button.mdx'), '# Button guide');

	const result = cleanGeneratedPropsPages(root);

	expect(result.removedCount).toBe(0);
	expect(existsSync(join(root, 'actions', 'button.mdx'))).toBe(true);
});

test('ignores a component directory that has neither generator-owned file', () => {
	const root = createTempDir();
	const componentDir = join(root, 'actions', 'button');
	mkdirSync(componentDir, { recursive: true });
	writeFileSync(join(componentDir, 'notes.txt'), 'keep me');

	const result = cleanGeneratedPropsPages(root);

	expect(result.removedCount).toBe(0);
	expect(existsSync(componentDir)).toBe(true);
	expect(existsSync(join(componentDir, 'notes.txt'))).toBe(true);
});
