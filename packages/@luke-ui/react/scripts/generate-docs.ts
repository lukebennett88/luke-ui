import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { discoverExports } from './lib/discover-exports.js';
import { parseBarrel, parseComponent } from './lib/parse-types.js';
import { renderIndex } from './lib/render-index.js';
import { renderLlmsFull } from './lib/render-llms-full.js';
import { renderBarrelPage, renderComponentPage } from './lib/render-page.js';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const docsDir = join(packageRoot, 'docs');

const pkg = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')) as {
	name: string;
	exports: Record<string, string>;
};

const discovered = discoverExports(pkg.exports);

await mkdir(docsDir, { recursive: true });

// Multi-export primitives: barrels that re-export many named values.
// These are rendered with renderBarrelPage instead of renderComponentPage.
const MULTI_EXPORT_PRIMITIVES = new Set(['./combobox-field/primitive', './field/primitive']);

const componentEntries = discovered.filter((entry) => entry.shape === 'component');

const pages = await Promise.all(
	componentEntries.map(async (entry) => {
		const sourcePath = sourceFromExport(packageRoot, entry.target);

		if (MULTI_EXPORT_PRIMITIVES.has(entry.path)) {
			const parsed = parseBarrel(sourcePath);
			const md = renderBarrelPage({
				slug: entry.slug,
				importPath: `${pkg.name}${entry.path.replace(/^\./, '')}`,
				tier: 'primitive',
				description: parsed.description,
				exports: parsed.exports,
			});
			return { slug: entry.slug, md };
		}

		const parsed = parseComponent(sourcePath);
		const proseMarkdown = await readProse(packageRoot, entry).catch(() => undefined);
		const md = renderComponentPage({
			slug: entry.slug,
			importPath: `${pkg.name}${entry.path.replace(/^\./, '')}`,
			tier: parsed.tier ?? entry.tier,
			parsed,
			proseMarkdown,
		});
		return { slug: entry.slug, md };
	}),
);

await Promise.all(pages.map(({ slug, md }) => writeFile(join(docsDir, `${slug}.md`), md, 'utf8')));

const barrelEntries = discovered.filter((entry) => entry.shape === 'barrel');

const barrelPages = await Promise.all(
	barrelEntries.map(async (entry) => {
		const sourcePath = sourceFromExport(packageRoot, entry.target);
		const parsed = parseBarrel(sourcePath);
		const md = renderBarrelPage({
			slug: entry.slug,
			importPath: `${pkg.name}${entry.path.replace(/^\./, '')}`,
			tier: 'n/a',
			description: parsed.description,
			exports: parsed.exports,
		});
		return { slug: entry.slug, md };
	}),
);

await Promise.all(
	barrelPages.map(({ slug, md }) => writeFile(join(docsDir, `${slug}.md`), md, 'utf8')),
);

const entriesWithDescriptions = await Promise.all(
	discovered.map(async (entry) => {
		if (entry.shape === 'asset') return entry;
		const sourcePath = sourceFromExport(packageRoot, entry.target);
		try {
			if (entry.shape === 'barrel') {
				const parsed = parseBarrel(sourcePath);
				return Object.assign({}, entry, { description: parsed.description });
			}
			if (MULTI_EXPORT_PRIMITIVES.has(entry.path)) {
				const parsed = parseBarrel(sourcePath);
				return Object.assign({}, entry, { description: parsed.description });
			}
			const parsed = parseComponent(sourcePath);
			return Object.assign({}, entry, { description: parsed.description });
		} catch {
			return entry;
		}
	}),
);

const llmsTxt = renderIndex({
	packageName: pkg.name,
	pitch: 'A React design system built on react-aria-components and vanilla-extract.',
	entries: entriesWithDescriptions,
	includeLibraryAuthors: true,
});

await writeFile(join(docsDir, 'llms.txt'), llmsTxt, 'utf8');

const distDocsDir = join(packageRoot, 'dist', 'docs');
await mkdir(distDocsDir, { recursive: true });
const aggregatedSlugs = discovered
	.filter((e) => e.shape === 'component' || e.shape === 'barrel')
	.map((e) => e.slug);
const llmsFull = await renderLlmsFull(docsDir, aggregatedSlugs);
await writeFile(join(distDocsDir, 'llms-full.md'), llmsFull, 'utf8');

// eslint-disable-next-line no-console -- build script progress
console.log(
	`generate-docs: wrote ${pages.length + barrelPages.length} pages + llms.txt + dist/docs/llms-full.md`,
);

function sourceFromExport(root: string, distTarget: string): string {
	const distRel = distTarget.replace(/^\.\/dist\//, '').replace(/\/index\.js$/, '');
	const tsxPath = join(root, 'src', distRel, 'index.tsx');
	const tsPath = join(root, 'src', distRel, 'index.ts');
	return existsSync(tsxPath) ? tsxPath : tsPath;
}

async function readProse(
	root: string,
	entry: { slug: string; path: string },
): Promise<string | undefined> {
	if (entry.path.endsWith('/primitive')) return undefined;
	const dirSlug = entry.path.replace(/^\.\//, '');
	const prosePath = join(root, 'src', dirSlug, `${dirSlug}.docs.md`);
	return readFile(prosePath, 'utf8');
}
