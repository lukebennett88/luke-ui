import fs from 'node:fs';
import path from 'node:path';

const packageRoot = path.resolve(import.meta.dirname, '..');
const storiesRoot = path.join(packageRoot, 'src');
const STORY_PLAY_PATTERN = /\bplay\s*:\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/g;
const ASSERTION_PATTERN = /\bexpect\s*\(/;

function storyFiles(directory: string): Array<string> {
	const files: Array<string> = [];
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...storyFiles(entryPath));
		else if (entry.name.endsWith('.stories.tsx')) files.push(entryPath);
	}
	return files;
}

function findPlayBodies(source: string): Array<{ body: string; line: number }> {
	const plays: Array<{ body: string; line: number }> = [];
	for (const match of source.matchAll(STORY_PLAY_PATTERN)) {
		const openingBrace = (match.index ?? 0) + match[0].length - 1;
		let depth = 0;
		let closingBrace = openingBrace;
		for (; closingBrace < source.length; closingBrace += 1) {
			if (source[closingBrace] === '{') depth += 1;
			if (source[closingBrace] === '}') {
				depth -= 1;
				if (depth === 0) break;
			}
		}
		plays.push({
			body: source.slice(openingBrace + 1, closingBrace),
			line: source.slice(0, match.index ?? 0).split('\n').length,
		});
	}

	return plays;
}

const violations: Array<string> = [];
for (const file of storyFiles(storiesRoot)) {
	// Theme stories are fixtures for theme diagnostics, not component tests. Keep
	// their existing assertions outside the component-testing rule.
	if (path.relative(storiesRoot, file).startsWith(`theme${path.sep}`)) continue;
	const source = fs.readFileSync(file, 'utf8');
	for (const play of findPlayBodies(source)) {
		if (ASSERTION_PATTERN.test(play.body)) {
			violations.push(`${path.relative(packageRoot, file)}:${play.line}`);
		}
	}
}

if (violations.length > 0) {
	// oxlint-disable-next-line no-console
	console.error('Story play functions must drive state, not assert behaviour:');
	for (const violation of violations) {
		// oxlint-disable-next-line no-console
		console.error(`  ${violation}`);
	}
	process.exitCode = 1;
}
