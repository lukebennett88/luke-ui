import { readdirSync, readFileSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';

interface ComponentDocContractOptions {
	docsDir: string;
}

interface Frontmatter {
	description?: string;
	source?: string;
	title?: string;
}

const PLACEHOLDER_PATTERNS = [
	{ label: 'generator TODO', pattern: /TODO:/ },
	{ label: 'best-practices placeholder', pattern: /Add a row per practice worth calling out/ },
	{ label: 'accessibility placeholder', pattern: /Describe accessibility considerations/ },
	{
		label: 'package-path placeholder',
		pattern: /`[A-Z][^`]*` from `@luke-ui\/react\/[^`]+`\./,
	},
] as const;

export function findComponentDocContractIssues({
	docsDir,
}: ComponentDocContractOptions): Array<string> {
	const resolvedDocsDir = resolve(docsDir);
	const issues: Array<string> = [];

	for (const guidePath of findComponentGuides(resolvedDocsDir)) {
		const relativeGuidePath = relative(resolvedDocsDir, guidePath);
		const guide = readFileSync(guidePath, 'utf8');
		const guideFrontmatter = readFrontmatter(guide);

		// Topical pages (e.g. forms/validation.mdx) live flat alongside component guides but
		// aren't component guides themselves — only a component guide declares a package `source:`.
		if (guideFrontmatter.source === undefined) continue;

		findPlaceholders(issues, relativeGuidePath, guide, guideFrontmatter);

		const componentName = basename(guidePath, '.mdx');
		const expectedExamples = [`${componentName}/basic`];
		if (relativeGuidePath.startsWith('primitives/')) {
			expectedExamples.push(`${componentName}-primitive/basic`);
		}
		const primaryExample = guide.match(/<ExampleBlock\b[\s\S]*?\bsrc=["']([^"']+)["']/)?.[1];

		if (primaryExample === undefined || !expectedExamples.includes(primaryExample)) {
			issues.push(
				`${relativeGuidePath}: primary example must use ${expectedExamples.join(' or ')}`,
			);
		}
	}

	return issues;
}

function findPlaceholders(
	issues: Array<string>,
	file: string,
	contents: string,
	frontmatter: Frontmatter,
): void {
	if (
		frontmatter.title !== undefined &&
		frontmatter.description === `${frontmatter.title} component.`
	) {
		issues.push(`${file}: replace the generic component description`);
	}

	for (const placeholder of PLACEHOLDER_PATTERNS) {
		if (placeholder.pattern.test(contents)) {
			issues.push(`${file}: remove the ${placeholder.label}`);
		}
	}
}

function readFrontmatter(contents: string): Frontmatter {
	const frontmatter = contents.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';

	return {
		description: readFrontmatterValue(frontmatter, 'description'),
		source: readFrontmatterValue(frontmatter, 'source'),
		title: readFrontmatterValue(frontmatter, 'title'),
	};
}

function readFrontmatterValue(frontmatter: string, key: keyof Frontmatter): string | undefined {
	const lines = frontmatter.split('\n');
	const keyPrefix = `${key}:`;

	for (const [index, line] of lines.entries()) {
		if (!line.startsWith(keyPrefix)) continue;

		const inlineValue = line.slice(keyPrefix.length).trim();
		if (inlineValue) return inlineValue;

		const continuation: Array<string> = [];
		for (const nextLine of lines.slice(index + 1)) {
			if (!nextLine.startsWith(' ')) break;
			continuation.push(nextLine.trim());
		}

		return continuation.join(' ');
	}

	return undefined;
}

/**
 * Discovers authored `*.mdx` files directly inside each group directory. This also picks up
 * flat topical pages (e.g. forms/validation.mdx), which the caller filters out by checking for
 * a `source:` frontmatter field — only real component guides declare one. Generated Props pages
 * live one level deeper as `<group>/<name>/props.mdx`, so they're excluded by directory depth.
 */
function findComponentGuides(directory: string): Array<string> {
	const guides: Array<string> = [];

	for (const group of readdirSync(directory, { withFileTypes: true })) {
		if (!group.isDirectory()) continue;
		const groupDir = resolve(directory, group.name);

		for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
			if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;
			guides.push(resolve(groupDir, entry.name));
		}
	}

	return guides.sort();
}
