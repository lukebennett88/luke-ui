import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverExports } from '@luke-ui/docs-tools/discover-exports';
import { parseBarrel, parseComponent } from '@luke-ui/docs-tools/parse-types';
import type { IndexEntry } from '@luke-ui/docs-tools/render-index';
import { renderIndex } from '@luke-ui/docs-tools/render-index';
import { renderLlmsFull } from '@luke-ui/docs-tools/render-llms-full';
import { renderPage } from '@luke-ui/docs-tools/render-page';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import packageJson from '../package.json' with { type: 'json' };

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const docsDir = join(packageRoot, 'docs');

const discovered = discoverExports(packageJson.exports, { packageRoot });
const descriptionByPath = new Map<string, string>();
const tierByPath = new Map<string, (typeof discovered)[number]['tier']>();

await mkdir(docsDir, { recursive: true });

const pages = await Promise.all(
	discovered.map(async (entry) => {
		if (entry.pageKind === 'asset') return;
		if (!entry.sourcePath) return;

		if (entry.pageKind === 'barrel') {
			const parsed = parseBarrel(entry.sourcePath);
			if (parsed.description) descriptionByPath.set(entry.path, parsed.description);
			const md = renderPage({
				kind: 'barrel',
				slug: entry.slug,
				importPath: `${packageJson.name}${entry.path.replace(/^\./, '')}`,
				tier: entry.tier,
				description: parsed.description,
				exports: parsed.exports,
			});
			return { slug: entry.slug, shape: entry.shape, tier: entry.tier, md };
		}

		const parsed = parseComponent(entry.sourcePath);
		if (parsed.description) descriptionByPath.set(entry.path, parsed.description);
		const tier = parsed.tier ?? entry.tier;
		if (parsed.tier) tierByPath.set(entry.path, parsed.tier);
		const proseMarkdown = await readProse(packageRoot, entry).catch(() => undefined);
		const md = renderPage({
			kind: 'component',
			slug: entry.slug,
			importPath: `${packageJson.name}${entry.path.replace(/^\./, '')}`,
			tier,
			parsed,
			proseMarkdown,
		});
		return { slug: entry.slug, shape: entry.shape, tier, md };
	}),
);

await Promise.all(
	pages.flatMap((page) =>
		page ? [writeFile(join(docsDir, `${page.slug}.md`), page.md, 'utf8')] : [],
	),
);

const entriesWithDescriptions: Array<IndexEntry> = discovered.map((entry) => {
	return Object.assign({}, entry, {
		tier: tierByPath.get(entry.path) ?? entry.tier,
		description: descriptionByPath.get(entry.path),
	});
});

const llmsTxt = renderIndex({
	packageName: packageJson.name,
	entries: entriesWithDescriptions,
	includeLibraryAuthors: true,
});

await writeFile(join(docsDir, 'llms.txt'), llmsTxt, 'utf8');

const distDocsDir = join(packageRoot, 'dist', 'docs');
await mkdir(distDocsDir, { recursive: true });
const llmsFull = renderLlmsFull(pages.filter((page) => page != null));
await writeFile(join(distDocsDir, 'llms-full.md'), llmsFull, 'utf8');

// eslint-disable-next-line no-console -- build script progress
console.log(
	`generate-docs: wrote ${pages.filter(Boolean).length} pages + llms.txt + dist/docs/llms-full.md`,
);

async function readProse(root: string, entry: { path: string }): Promise<string | undefined> {
	if (entry.path.endsWith('/primitive')) return;
	const dirSlug = entry.path.replace(/^\.\//, '');
	const prosePath = join(root, 'src', dirSlug, `${dirSlug}.docs.md`);
	return readFile(prosePath, 'utf8');
}
