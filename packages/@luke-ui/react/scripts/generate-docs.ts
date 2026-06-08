import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePackageDocsCatalog } from '@luke-ui/docs-tools/package-docs-catalog';
import { renderIndex } from '@luke-ui/docs-tools/render-index';
import { renderLlmsFull } from '@luke-ui/docs-tools/render-llms-full';
import { renderPage } from '@luke-ui/docs-tools/render-page';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import packageJson from '../package.json' with { type: 'json' };

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const docsDir = join(packageRoot, 'docs');

const catalog = resolvePackageDocsCatalog({
	packageRoot,
	exportsField: packageJson.exports,
});

await mkdir(docsDir, { recursive: true });

const pages = await Promise.all(
	catalog.map(async (entry) => {
		if (entry.pageKind === 'asset') return;

		const proseMarkdown =
			entry.pageKind === 'component'
				? await readProse(packageRoot, entry).catch(() => undefined)
				: undefined;
		const md = renderPage({
			entry,
			importPath: `${packageJson.name}${entry.path.replace(/^\./, '')}`,
			proseMarkdown,
		});
		return { slug: entry.slug, shape: entry.shape, tier: entry.tier, md };
	}),
);

await Promise.all(
	pages.flatMap((page) =>
		page ? [writeFile(join(docsDir, `${page.slug}.md`), page.md, 'utf8')] : [],
	),
);

const llmsTxt = renderIndex({
	packageName: packageJson.name,
	entries: catalog,
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
