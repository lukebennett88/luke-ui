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

export async function applyCreationPlan(root: string, plan: CreationWork): Promise<void> {
	await validateObjectEntryEdits(root, plan.jsonEdits);
	await Promise.all(plan.files.map((file) => writePlanFile(root, file)));
	await Promise.all(plan.jsonEdits.map((edit) => applyJsonEdit(root, edit)));
	await Promise.all(plan.textFileInserts.map((edit) => applyTextInsertEdit(root, edit)));
	await Promise.all(plan.importEdits.map((edit) => applyImportEdit(root, edit)));
}

async function writePlanFile(root: string, file: PlanFile): Promise<void> {
	const target = join(root, file.path);
	await mkdir(dirname(target), { recursive: true });
	const formatted = await formatGeneratedContent(target, file.contents);
	await writeFile(target, formatted, 'utf8');
}

async function applyJsonEdit(root: string, edit: CreationWork['jsonEdits'][number]): Promise<void> {
	const target = join(root, edit.path);
	await mkdir(dirname(target), { recursive: true });
	const data = await readJson(target, edit.kind === 'object-entry-add' ? 'React UI' : edit.title);
	if (edit.kind === 'object-entry-add') {
		const entries = z.record(z.string(), z.unknown()).parse(data[edit.key]);
		data[edit.key] = { ...entries, [edit.entry]: edit.value };
		const raw = JSON.stringify(data, null, '\t') + '\n';
		const formatted = await formatGeneratedContent(target, raw);
		await writeFile(target, formatted, 'utf8');
		return;
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
	const raw = `${JSON.stringify(data, null, '\t')}\n`;
	const formatted = await formatGeneratedContent(target, raw);
	await writeFile(target, formatted, 'utf8');
}

async function validateObjectEntryEdits(
	root: string,
	edits: CreationWork['jsonEdits'],
): Promise<void> {
	await Promise.all(
		edits.map(async (edit) => {
			if (edit.kind !== 'object-entry-add') return;
			const data = await readJson(join(root, edit.path), 'React package');
			const entries = z.record(z.string(), z.unknown()).parse(data[edit.key]);
			const current = entries[edit.entry];
			if (current !== undefined && current !== edit.value) {
				throw new Error('Cannot add export entry that already exists: ' + edit.entry);
			}
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

async function applyImportEdit(
	root: string,
	edit: CreationWork['importEdits'][number],
): Promise<void> {
	const target = join(root, edit.path);
	await mkdir(dirname(target), { recursive: true });
	const content = await readFile(target, 'utf8').catch(() => '');
	await writeFile(target, insertImport(content, edit.line), 'utf8');
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

async function applyTextInsertEdit(
	root: string,
	edit: CreationWork['textFileInserts'][number],
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
