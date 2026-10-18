import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';

const RELATIVE_SPECIFIER_PATTERN = /(?:from\s+|import\s*\(|require\s*\()\s*['"](\.[^'"]+)['"]/g;

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.d.ts', '.js', '.jsx', '.mjs', '.cjs'] as const;

/**
 * Content hash of a TypeScript entry file and the relative modules it pulls in. Used so generated
 * API tables invalidate when an imported type changes without the documented file changing.
 */
export function hashTypescriptSourceGraph(entryPath: string, entryContent: string): string {
	const hash = createHash('sha256');
	const queue = [normalize(entryPath)];
	const seen = new Set<string>();

	while (queue.length > 0) {
		const filePath = queue.pop();
		if (filePath === undefined || seen.has(filePath)) continue;
		seen.add(filePath);

		const content = filePath === normalize(entryPath) ? entryContent : readFileIfPresent(filePath);
		if (content === undefined) continue;

		hash.update(filePath);
		hash.update('\0');
		hash.update(content);
		hash.update('\0');

		for (const specifier of relativeSpecifiers(content)) {
			const resolved = resolveRelativeModule(dirname(filePath), specifier);
			if (resolved !== undefined) queue.push(resolved);
		}
	}

	return hash.digest('hex');
}

function readFileIfPresent(filePath: string): string | undefined {
	try {
		return readFileSync(filePath, 'utf8');
	} catch {
		return undefined;
	}
}

function relativeSpecifiers(content: string): Array<string> {
	const specifiers: Array<string> = [];
	RELATIVE_SPECIFIER_PATTERN.lastIndex = 0;
	for (const match of content.matchAll(RELATIVE_SPECIFIER_PATTERN)) {
		const specifier = match[1];
		if (specifier !== undefined) specifiers.push(specifier);
	}
	return specifiers;
}

function resolveRelativeModule(fromDir: string, specifier: string): string | undefined {
	const base = join(fromDir, specifier);
	const candidates = [
		base,
		...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
		...SOURCE_EXTENSIONS.map((extension) => join(base, `index${extension}`)),
	];

	const specifierExtension = extname(specifier);
	if (
		specifierExtension === '.js' ||
		specifierExtension === '.jsx' ||
		specifierExtension === '.mjs'
	) {
		const withoutJs = base.slice(0, -specifierExtension.length);
		candidates.push(
			`${withoutJs}.ts`,
			`${withoutJs}.tsx`,
			`${withoutJs}.d.ts`,
			join(withoutJs, 'index.ts'),
			join(withoutJs, 'index.tsx'),
		);
	}

	for (const candidate of candidates) {
		if (existsSync(candidate)) return normalize(candidate);
	}
	return undefined;
}
