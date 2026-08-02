import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';

interface ComponentDocContractOptions {
	docsDir: string;
}

interface Frontmatter {
	description?: string;
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

	for (const propsPath of findFiles(resolvedDocsDir, 'props.mdx')) {
		const componentDir = resolve(propsPath, '..');
		const guidePath = resolve(componentDir, 'index.mdx');
		const relativeComponentDir = relative(resolvedDocsDir, componentDir);

		if (!existsSync(guidePath)) {
			issues.push(`${relativeComponentDir}: missing index.mdx`);
			continue;
		}

		const guide = readFileSync(guidePath, 'utf8');
		const props = readFileSync(propsPath, 'utf8');
		const guideFrontmatter = readFrontmatter(guide);
		const propsFrontmatter = readFrontmatter(props);

		compareFrontmatter(issues, relativeComponentDir, guideFrontmatter, propsFrontmatter);
		findPlaceholders(issues, `${relativeComponentDir}/index.mdx`, guide, guideFrontmatter);
		findPlaceholders(issues, `${relativeComponentDir}/props.mdx`, props, propsFrontmatter);

		const componentName = basename(componentDir);
		const expectedExamples = [`${componentName}/basic`];
		if (relativeComponentDir.startsWith('primitives/')) {
			expectedExamples.push(`${componentName}-primitive/basic`);
		}
		const primaryExample = guide.match(/<ExampleBlock\b[\s\S]*?\bsrc=["']([^"']+)["']/)?.[1];

		if (primaryExample === undefined || !expectedExamples.includes(primaryExample)) {
			issues.push(
				`${relativeComponentDir}/index.mdx: primary example must use ${expectedExamples.join(' or ')}`,
			);
		}
	}

	return issues;
}

function compareFrontmatter(
	issues: Array<string>,
	componentDir: string,
	guide: Frontmatter,
	props: Frontmatter,
): void {
	if (guide.title !== props.title) {
		issues.push(`${componentDir}: guide and Props titles must match`);
	}

	if (guide.description !== props.description) {
		issues.push(`${componentDir}: guide and Props descriptions must match`);
	}
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

function findFiles(directory: string, fileName: string): Array<string> {
	const files: Array<string> = [];

	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = resolve(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...findFiles(path, fileName));
			continue;
		}
		if (entry.name === fileName) files.push(path);
	}

	return files.sort();
}
