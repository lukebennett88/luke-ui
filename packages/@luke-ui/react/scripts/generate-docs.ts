import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePackageDocsCatalog } from '@luke-ui/docs-tools/package-docs-catalog';
import { renderIndex } from '@luke-ui/docs-tools/render-index';
import { renderLlmsFull } from '@luke-ui/docs-tools/render-llms-full';
import { renderPage } from '@luke-ui/docs-tools/render-page';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import packageJson from '../package.json' with { type: 'json' };

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const docsDir = join(packageRoot, 'docs');

const catalog = resolvePackageDocsCatalog({
	exportsField: packageJson.exports,
	packageRoot,
});

await mkdir(docsDir, { recursive: true });
await removeGeneratedMarkdown(docsDir);

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
		return { md, shape: entry.shape, slug: entry.slug, tier: entry.tier };
	}),
);

await Promise.all(
	pages.flatMap((page) =>
		page ? [writeFile(join(docsDir, `${page.slug}.md`), page.md, 'utf8')] : [],
	),
);

const llmsTxt = renderIndex({
	entries: catalog,
	includeLibraryAuthors: true,
	packageName: packageJson.name,
});

await writeFile(join(docsDir, 'llms.txt'), llmsTxt, 'utf8');

const distDocsDir = join(packageRoot, 'dist', 'docs');
await mkdir(distDocsDir, { recursive: true });
await removeGeneratedMarkdown(distDocsDir);
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

async function removeGeneratedMarkdown(dir: string): Promise<void> {
	const files = await readdir(dir);

	await Promise.all(
		files
			.filter((file) => file.endsWith('.md'))
			.map((file) => rm(join(dir, file), { force: true })),
	);
}
