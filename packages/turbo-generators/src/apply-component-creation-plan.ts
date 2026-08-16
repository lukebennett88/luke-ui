import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import type * as ViteFmt from 'vite-plus/fmt';
import * as z from 'zod';
import type { ComponentCreationPlan, PlanFile } from './component-creation-plan.js';
import { createComponentWork, parseComponentAnswers } from './component-creation-plan.js';

// `config.ts` (this module's ultimate importer) is loaded by `@turbo/gen` through an esbuild
// bundle (bundle:true, format:'cjs'). Two things break once that bundler actually traces into
// real module content:
//   - oxfmt's `format()` implementation contains its own dynamic `import()` calls for optional,
//     uninstalled prettier plugins (Astro, Marko, Twig, ...). A statically analyzable
//     `import('vite-plus/fmt')` lets esbuild trace into that file and fail the whole bundle
//     trying to resolve those plugins.
//   - `vite-plus`'s own published output reads `import.meta.url` at module scope. esbuild's
//     node+cjs target replaces `import.meta` with `{}` instead of shimming it, so a statically
//     bundled `import rootConfig from '../../../vite.config.js'` (which pulls in `defineConfig`
//     from `vite-plus`) throws `createRequire(undefined)` at load time.
// Routing both specifiers through a variable/expression (rather than a literal esbuild can trace)
// hides them from static analysis, so they're left as real dynamic imports resolved by Node at
// runtime, where both work correctly (genuine ESM, real `import.meta`, real installed packages).
async function loadFormat(): Promise<typeof ViteFmt> {
	const specifier = 'vite-plus/fmt';
	return import(specifier);
}

async function findRepoRoot(startDir: string): Promise<string> {
	async function walk(dir: string): Promise<string> {
		try {
			await access(join(dir, 'pnpm-workspace.yaml'));
			return dir;
		} catch {
			const parent = dirname(dir);
			if (parent === dir) {
				throw new Error(
					`Could not locate repository root (no pnpm-workspace.yaml) above ${startDir}`,
				);
			}
			return walk(parent);
		}
	}
	return walk(startDir);
}

let cachedFmtConfig: Promise<ViteFmt.FormatConfig | undefined> | undefined;

async function loadRootFmtConfig(): Promise<ViteFmt.FormatConfig | undefined> {
	cachedFmtConfig ??= (async () => {
		const repoRoot = await findRepoRoot(process.cwd());
		const configPath = join(repoRoot, 'vite.config.ts');
		const mod: { default?: { fmt?: ViteFmt.FormatConfig } } = await import(
			pathToFileURL(configPath).href
		);
		return mod.default?.fmt;
	})();
	return cachedFmtConfig;
}

// Runs generated content through the repo's real formatter before it hits disk, so a freshly
// scaffolded file never needs a hand edit to satisfy `check:format`/`check:format-root`.
async function formatGeneratedContent(target: string, raw: string): Promise<string> {
	const [{ format }, fmtConfig] = await Promise.all([loadFormat(), loadRootFmtConfig()]);
	const result = await format(target, raw, fmtConfig);
	if (result.errors.length > 0) {
		throw new Error(
			`Failed to format ${target}: ${result.errors.map((error) => error.message).join(', ')}`,
		);
	}
	return result.code;
}

const docsMetaSchema = z.record(z.string(), z.unknown());
type ComponentCreationWork = ReturnType<typeof createComponentWork>;

export async function createComponent(
	root: string,
	answers: unknown,
): Promise<ComponentCreationPlan> {
	const work = createComponentWork(parseComponentAnswers(answers));
	await applyComponentCreationPlan(root, work);
	return { expected: work.expected, files: work.files };
}

async function applyComponentCreationPlan(
	root: string,
	plan: ComponentCreationWork,
): Promise<void> {
	await Promise.all(plan.files.map((file) => writePlanFile(root, file)));
	await Promise.all(plan.jsonEdits.map((edit) => applyJsonEdit(root, edit)));
	await Promise.all(plan.textFileInserts.map((edit) => applyTextInsertEdit(root, edit)));
	await Promise.all(plan.sortedImportEdits.map((edit) => applySortedImportEdit(root, edit)));
}

async function writePlanFile(root: string, file: PlanFile): Promise<void> {
	const target = join(root, file.path);
	await mkdir(dirname(target), { recursive: true });
	const formatted = await formatGeneratedContent(target, file.contents);
	await writeFile(target, formatted, 'utf8');
}

async function applyJsonEdit(
	root: string,
	edit: ComponentCreationWork['jsonEdits'][number],
): Promise<void> {
	const target = join(root, edit.path);
	await mkdir(dirname(target), { recursive: true });
	const data = await readJson(target, edit.title);
	const current = data[edit.key];
	const currentPages = Array.isArray(current) ? current.filter(isString) : [];
	const pages = [...new Set([...currentPages, edit.value])].sort((a, b) => a.localeCompare(b));
	data[edit.key] = pages;
	const raw = `${JSON.stringify(data, null, '\t')}\n`;
	const formatted = await formatGeneratedContent(target, raw);
	await writeFile(target, formatted, 'utf8');
}

async function readJson(path: string, title: string): Promise<Record<string, unknown>> {
	try {
		const json: unknown = JSON.parse(await readFile(path, 'utf8'));
		return docsMetaSchema.parse(json);
	} catch (err) {
		if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
			return { pages: [], title };
		}
		throw err;
	}
}

async function applySortedImportEdit(
	root: string,
	edit: ComponentCreationWork['sortedImportEdits'][number],
): Promise<void> {
	const target = join(root, edit.path);
	await mkdir(dirname(target), { recursive: true });
	const content = await readFile(target, 'utf8').catch(() => '');
	await writeFile(target, insertSortedImport(content, edit.line), 'utf8');
}

function insertSortedImport(content: string, line: string): string {
	const lines = content.endsWith('\n') ? content.slice(0, -1).split('\n') : content.split('\n');
	if (lines.length === 1 && lines[0] === '') lines.pop();
	if (lines.includes(line)) return `${lines.join('\n')}\n`;

	const header: Array<string> = [];
	const imports: Array<string> = [];
	const footer: Array<string> = [];
	let seenImport = false;

	for (const current of lines) {
		if (current.startsWith('import ')) {
			seenImport = true;
			imports.push(current);
			continue;
		}

		if (seenImport) {
			footer.push(current);
			continue;
		}

		header.push(current);
	}

	imports.push(line);
	imports.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));

	return `${[...header, ...imports, ...footer].join('\n')}\n`;
}

async function applyTextInsertEdit(
	root: string,
	edit: ComponentCreationWork['textFileInserts'][number],
): Promise<void> {
	const target = join(root, edit.path);
	const content = await readFile(target, 'utf8');
	const insertion = edit.lines.join('\n');
	if (content.includes(insertion)) return;

	const markerIndex = content.indexOf(edit.marker);
	if (markerIndex === -1) {
		throw new Error(`Could not find insertion marker in ${edit.path}: ${edit.marker}`);
	}

	const before = content.slice(0, markerIndex);
	const separator = before.endsWith('\n') ? '' : '\n';
	const updated = `${before}${separator}${insertion}\n${content.slice(markerIndex)}`;
	await writeFile(target, updated, 'utf8');
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}
