import { dirname, join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import type {
	ComponentCreationPlan,
	JsonArrayAddSortedEdit,
	PlanFile,
} from './component-creation-plan.js';

const docsMetaSchema = z.record(z.string(), z.unknown());

export async function applyComponentCreationPlan(
	root: string,
	plan: ComponentCreationPlan,
): Promise<void> {
	await Promise.all(plan.files.map((file) => writePlanFile(root, file)));
	await Promise.all(plan.jsonEdits.map((edit) => applyJsonEdit(root, edit)));
}

async function writePlanFile(root: string, file: PlanFile): Promise<void> {
	const target = join(root, file.path);
	await mkdir(dirname(target), { recursive: true });
	await writeFile(target, file.contents, 'utf8');
}

async function applyJsonEdit(root: string, edit: JsonArrayAddSortedEdit): Promise<void> {
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

function isString(value: unknown): value is string {
	return typeof value === 'string';
}
