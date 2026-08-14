import { dirname, join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as z from 'zod';
import {
	createComponentWork,
	type ComponentCreationPlan,
	type PlanFile,
} from './component-creation-plan.js';

const docsMetaSchema = z.record(z.string(), z.unknown());
type ComponentCreationWork = ReturnType<typeof createComponentWork>;

export async function createComponent(
	root: string,
	answers: unknown,
): Promise<ComponentCreationPlan> {
	const work = createComponentWork(answers);
	await applyComponentCreationPlan(root, work);
	return { expected: work.expected, files: work.files };
}

async function applyComponentCreationPlan(root: string, plan: ComponentCreationWork): Promise<void> {
	await Promise.all(plan.files.map((file) => writePlanFile(root, file)));
	await Promise.all(plan.jsonEdits.map((edit) => applyJsonEdit(root, edit)));
	await Promise.all(plan.textFileInserts.map((edit) => applyTextInsertEdit(root, edit)));
	await Promise.all(plan.sortedImportEdits.map((edit) => applySortedImportEdit(root, edit)));
}

async function writePlanFile(root: string, file: PlanFile): Promise<void> {
	const target = join(root, file.path);
	await mkdir(dirname(target), { recursive: true });
	await writeFile(target, file.contents, 'utf8');
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
	await writeFile(target, `${JSON.stringify(data, null, '\t')}\n`, 'utf8');
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
