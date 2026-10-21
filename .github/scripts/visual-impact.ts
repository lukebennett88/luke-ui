import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { appendFile, readFile } from 'node:fs/promises';

export function needsVisualComparison(paths: Array<string> | undefined): boolean {
	return (
		paths === undefined || paths.length === 0 || paths.some((file) => !SAFE_PROSE_PATHS.has(file))
	);
}

// Keep this finite list aligned with visual-baseline.yml. New paths require comparison.
export const SAFE_PROSE_PATHS = new Set([
	'AGENTS.md',
	'README.md',
	'docs/COMPONENTS.md',
	'docs/CONVENTIONS.md',
	'docs/DEPENDENCIES.md',
	'docs/DOCUMENTATION.md',
	'docs/PUBLIC_API.md',
	'docs/STYLING.md',
	'docs/TESTING.md',
	'docs/THEME_COLOUR_GENERATION.md',
	'docs/VISUAL_TESTING.md',
	'docs/WORKFLOWS.md',
	'.agents/papercuts.md',
	'.agents/skills/review-pr/SKILL.md',
	'.agents/skills/work-on-issue/SKILL.md',
	'.agents/skills/write-docs/SKILL.md',
	'.agents/skills/write-issue/SKILL.md',
	'.agents/skills/write-pr/SKILL.md',
	'.agents/skills/write-tests/SKILL.md',
	'.changeset/README.md',
]);

const SHA_PATTERN = /^[0-9a-f]{40}$/;

async function changedPaths(): Promise<Array<string> | undefined> {
	try {
		const eventPath = process.env.GITHUB_EVENT_PATH;
		if (!eventPath) return undefined;
		const event = JSON.parse(await readFile(eventPath, 'utf8')) as {
			pull_request?: { base?: { sha?: unknown }; head?: { sha?: unknown } };
		};
		const base = event.pull_request?.base?.sha;
		const head = event.pull_request?.head?.sha;
		if (typeof base !== 'string' || typeof head !== 'string') return undefined;
		if (!SHA_PATTERN.test(base) || !SHA_PATTERN.test(head)) return undefined;

		// A full local diff has no API file limit. Disable renames so both paths count.
		const diff = execFileSync(
			'git',
			[
				'diff',
				'--no-ext-diff',
				'--no-textconv',
				'--name-only',
				'--no-renames',
				'-z',
				`${base}...${head}`,
				'--',
			],
			{ encoding: 'utf8', stdio: 'pipe' },
		);
		if (!diff.endsWith('\0')) return undefined;
		return diff.slice(0, -1).split('\0');
	} catch {
		process.stdout.write('Cannot prove this change is unrelated. Visual comparison is required.\n');
		return undefined;
	}
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(path.resolve(entry)).href) {
	const output = process.env.GITHUB_OUTPUT;
	if (!output) throw new Error('GITHUB_OUTPUT is not set.');
	const required = needsVisualComparison(await changedPaths());
	process.stdout.write(`Visual comparison required: ${required}\n`);
	await appendFile(output, `required=${required}\n`);
}
