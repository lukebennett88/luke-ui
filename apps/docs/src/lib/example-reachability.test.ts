import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, test } from 'vite-plus/test';
import { findOrphanedExamples } from './remark-validate-examples.js';

const testDirectories: Array<string> = [];

afterEach(() => {
	for (const directory of testDirectories) {
		rmSync(directory, { force: true, recursive: true });
	}

	testDirectories.length = 0;
});

test('finds examples that are neither documented nor imported by another example', () => {
	const directory = mkdtempSync(join(tmpdir(), 'luke-ui-example-reachability-'));
	testDirectories.push(directory);

	const examplesDir = join(directory, 'src/examples');
	const docsDir = join(directory, 'content/docs');
	mkdirSync(join(examplesDir, 'profile'), { recursive: true });
	mkdirSync(docsDir, { recursive: true });
	writeFileSync(
		join(docsDir, 'profile.mdx'),
		'<ExampleBlock src="profile/basic" title="Profile" description="A profile." />',
	);
	writeFileSync(
		join(examplesDir, 'profile/basic.tsx'),
		[
			"import { Preferences } from './preferences';",
			"import { ProfileDetails } from './profile-details.js';",
			'',
			'export default ProfileDetails;',
			'export { Preferences };',
			'',
		].join('\n'),
	);
	writeFileSync(
		join(examplesDir, 'profile/profile-details.tsx'),
		'export function ProfileDetails() { return null; }\n',
	);
	writeFileSync(
		join(examplesDir, 'profile/preferences.tsx'),
		'export function Preferences() { return null; }\n',
	);
	writeFileSync(
		join(examplesDir, 'profile/obsolete.tsx'),
		'export default function Obsolete() { return null; }\n',
	);

	expect(findOrphanedExamples({ docsDir, examplesDir })).toEqual(['profile/obsolete.tsx']);
});

test('finds no orphaned examples in the docs app', () => {
	expect(
		findOrphanedExamples({
			docsDir: resolve(import.meta.dirname, '../../content/docs'),
			examplesDir: resolve(import.meta.dirname, '../examples'),
		}),
	).toEqual([]);
});
