import { readFileSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
import type { DocsFrontmatter } from './docs-frontmatter.js';
import { readFrontmatter } from './docs-frontmatter.js';
import { findMdxFiles } from './docs-mdx-files.js';
import { exampleBlockSources } from './example-block-sources.js';

interface ComponentDocContractOptions {
	docsDir: string;
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

		// Only a component guide declares a package `source:`.
		if (guideFrontmatter.source === undefined) continue;

		findPlaceholders(issues, relativeGuidePath, guide, guideFrontmatter);

		const componentName = basename(guidePath, '.mdx');
		const expectedExamples = [`${componentName}/basic`];
		if (relativeGuidePath.startsWith('primitives/')) {
			expectedExamples.push(`${componentName}-primitive/basic`);
		}
		const primaryExample = exampleBlockSources(guide)[0];

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
	frontmatter: DocsFrontmatter,
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

/**
 * Authored guides are `<group>/<name>.mdx`. Generated Props pages live one level
 * deeper as `<group>/<name>/props.mdx`, so they stay out. The caller skips files
 * that do not declare `source:`.
 */
function findComponentGuides(directory: string): Array<string> {
	return findMdxFiles(directory).filter(
		(file) => relative(directory, file).split('/').length === 2,
	);
}
