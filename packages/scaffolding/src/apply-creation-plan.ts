import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import type * as ViteFmt from 'vite-plus/fmt';
import * as z from 'zod';
import type { CreationWork, PlanFile } from './creation-plan-types.js';

// Keep Vite+ imports dynamic so optional formatter plugins are resolved only when needed and
// `import.meta.url` remains available in the native ESM runtime.
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

// Runs generated content through the repo's formatter before it hits disk, so a fresh scaffold
// already satisfies the formatting checks.
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

interface PreparedWrite {
	contents: string;
	target: string;
}

// Compute every output before writing anything, so a late validation failure
// leaves no partial scaffold behind.
export async function applyCreationPlan(root: string, plan: CreationWork): Promise<void> {
	const prepared: Array<PreparedWrite> = [
		...(await preparePlanFiles(root, plan.files)),
		...(await prepareJsonEdits(root, plan.jsonEdits)),
		...(await prepareTextInsertEdits(root, plan.textFileInserts)),
		...(await prepareImportEdits(root, plan.importEdits)),
	];

	await Promise.all(
		prepared.map(async (write) => {
			await mkdir(dirname(write.target), { recursive: true });
			await writeFile(write.target, write.contents, 'utf8');
		}),
	);
}

async function preparePlanFiles(
	root: string,
	files: Array<PlanFile>,
): Promise<Array<PreparedWrite>> {
	return Promise.all(
		files.map(async (file) => {
			const target = join(root, file.path);
			return { contents: await formatGeneratedContent(target, file.contents), target };
		}),
	);
}

async function prepareJsonEdits(
	root: string,
	edits: CreationWork['jsonEdits'],
): Promise<Array<PreparedWrite>> {
	const dataByPath = new Map<string, Record<string, unknown>>(
		await Promise.all(
			[...new Set(edits.map((edit) => edit.path))].map(async (path) => {
				const firstEdit = edits.find((edit) => edit.path === path);
				const target = join(root, path);
				const data = await readJson(
					target,
					firstEdit?.kind === 'object-entry-add' ? 'React UI' : (firstEdit?.title ?? 'React UI'),
				);
				return [target, data] as const;
			}),
		),
	);
	for (const edit of edits) {
		const target = join(root, edit.path);
		const data = dataByPath.get(target);
		if (data === undefined) continue;
		if (edit.kind === 'object-entry-add') {
			const entries = z.record(z.string(), z.unknown()).parse(data[edit.key]);
			const current = entries[edit.entry];
			if (current !== undefined && current !== edit.value) {
				throw new Error('Cannot add export entry that already exists: ' + edit.entry);
			}
			data[edit.key] = { ...entries, [edit.entry]: edit.value };
			continue;
		}

		const current = data[edit.key];
		const currentPages = Array.isArray(current) ? current.filter(isString) : [];
		let pages: Array<string>;
		if (edit.kind === 'array-add-sorted') {
			pages = [...new Set([...currentPages, edit.value])].toSorted((a, b) => a.localeCompare(b));
		} else if (edit.kind === 'array-add-prefix-sorted') {
			pages = insertSortedAmongPrefix(currentPages, edit.value, edit.sectionHeader);
		} else {
			pages = appendUniquePage(currentPages, edit.value);
		}
		data[edit.key] = pages;
	}

	return Promise.all(
		[...dataByPath].map(async ([target, data]) => {
			const raw = `${JSON.stringify(data, null, '\t')}\n`;
			return { contents: await formatGeneratedContent(target, raw), target };
		}),
	);
}

function appendUniquePage(pages: Array<string>, value: string): Array<string> {
	if (pages.includes(value)) return pages;
	return [...pages, value];
}

function insertSortedAmongPrefix(
	pages: Array<string>,
	value: string,
	sectionHeader: string,
): Array<string> {
	if (pages.includes(value)) return pages;

	const separator = value.indexOf('/');
	if (separator === -1) {
		throw new Error(
			`Cannot insert "${value}" with prefix sorting: expected a group/name sidebar entry`,
		);
	}

	const prefix = value.slice(0, separator + 1);
	let first = -1;
	let last = -1;
	for (const [index, page] of pages.entries()) {
		if (!page.startsWith(prefix)) continue;
		if (first === -1) first = index;
		last = index;
	}

	if (first === -1) {
		const headerIndex = pages.indexOf(sectionHeader);
		if (headerIndex === -1) {
			throw new Error(
				`Cannot insert "${value}": root components sidebar is missing section header "${sectionHeader}"`,
			);
		}
		return [...pages.slice(0, headerIndex + 1), value, ...pages.slice(headerIndex + 1)];
	}

	let insertAt = last + 1;
	for (let index = first; index <= last; index += 1) {
		const page = pages[index];
		if (page !== undefined && value.localeCompare(page) < 0) {
			insertAt = index;
			break;
		}
	}

	return [...pages.slice(0, insertAt), value, ...pages.slice(insertAt)];
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

async function prepareImportEdits(
	root: string,
	edits: CreationWork['importEdits'],
): Promise<Array<PreparedWrite>> {
	const contentByPath = new Map<string, string>(
		await Promise.all(
			[...new Set(edits.map((edit) => edit.path))].map(async (path) => {
				const target = join(root, path);
				return [target, await readFile(target, 'utf8').catch(() => '')] as const;
			}),
		),
	);
	for (const edit of edits) {
		const target = join(root, edit.path);
		const content = contentByPath.get(target);
		if (content === undefined) continue;
		contentByPath.set(target, insertImport(content, edit.line));
	}
	return [...contentByPath].map(([target, contents]) => ({ contents, target }));
}

// The registry this targets is in dependency order, not alphabetical order, so appending
// preserves cascade precedence between same-layer, same-specificity modules.
function insertImport(content: string, line: string): string {
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

	return `${[...header, ...imports, ...footer].join('\n')}\n`;
}

async function prepareTextInsertEdits(
	root: string,
	edits: CreationWork['textFileInserts'],
): Promise<Array<PreparedWrite>> {
	const contentByPath = new Map<string, string>(
		await Promise.all(
			[...new Set(edits.map((edit) => edit.path))].map(async (path) => {
				const target = join(root, path);
				return [target, await readFile(target, 'utf8')] as const;
			}),
		),
	);
	for (const edit of edits) {
		const target = join(root, edit.path);
		const content = contentByPath.get(target);
		if (content === undefined) continue;
		const insertion = edit.lines.join('\n');
		if (content.includes(insertion)) {
			contentByPath.set(target, content);
			continue;
		}

		const markerIndex = content.indexOf(edit.marker);
		if (markerIndex === -1) {
			throw new Error(`Could not find insertion marker in ${edit.path}: ${edit.marker}`);
		}

		const before = content.slice(0, markerIndex);
		const separator = before.endsWith('\n') ? '' : '\n';
		contentByPath.set(target, `${before}${separator}${insertion}\n${content.slice(markerIndex)}`);
	}
	return [...contentByPath].map(([target, contents]) => ({ contents, target }));
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}
