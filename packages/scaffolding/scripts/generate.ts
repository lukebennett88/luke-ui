import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import * as z from 'zod';
import { createComponent } from '../src/apply-component-creation-plan.js';
import { createPrimitive } from '../src/apply-primitive-creation-plan.js';
import {
	COMPONENT_DEFAULTS,
	DOC_GROUPS,
	createComponentPlan,
	parseComponentAnswers,
	validateComponentName,
} from '../src/component-creation-plan.js';
import type {
	ComponentCreationPlan,
	CreateComponentInput,
} from '../src/component-creation-plan.js';
import {
	PRIMITIVE_DEFAULTS,
	createPrimitivePlan,
	parsePrimitiveAnswers,
	validatePrimitiveName,
} from '../src/primitive-creation-plan.js';
import type {
	CreatePrimitiveInput,
	PrimitiveCreationPlan,
} from '../src/primitive-creation-plan.js';

type ScaffoldRequest =
	| { answers: CreateComponentInput; dryRun: boolean; kind: 'component' }
	| { answers: CreatePrimitiveInput; dryRun: boolean; kind: 'primitive' };

const generatorName = process.argv[2];
const validGenerator = generatorName === 'component' || generatorName === 'primitive';

if (!validGenerator) {
	process.stderr.write('Usage: pnpm scaffold:<component|primitive> [--args] <name> [options]\n');
	process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

try {
	const request = await readAnswers(generatorName, process.argv.slice(3));

	if (request.kind === 'component') {
		await runRequest(createComponentPlan(request.answers), request.dryRun, () =>
			createComponent(root, request.answers),
		);
	} else {
		await runRequest(createPrimitivePlan(request.answers), request.dryRun, () =>
			createPrimitive(root, request.answers),
		);
	}
} catch (error) {
	const message =
		error instanceof z.ZodError
			? readableZodError(error)
			: error instanceof Error
				? error.message
				: String(error);
	process.stderr.write(`${message}\n`);
	process.exitCode = 1;
}

function inputClosedError(): Error {
	return new Error('Input closed before scaffold answers were complete.');
}

function readableZodError(error: z.ZodError): string {
	for (const issue of error.issues) {
		if (issue.path.includes('docsGroup')) {
			return `Invalid docs group: expected one of ${DOC_GROUPS.join(', ')}.`;
		}
	}
	const issue = error.issues[0];
	if (issue === undefined) return 'Invalid arguments.';
	const field = issue.path.length > 0 ? String(issue.path.at(-1)) : 'argument';
	return `Invalid ${field}: ${issue.message.replaceAll(/\s+/g, ' ')}`;
}

async function runRequest(
	plan: ComponentCreationPlan | PrimitiveCreationPlan,
	dryRun: boolean,
	create: () => Promise<ComponentCreationPlan | PrimitiveCreationPlan>,
): Promise<void> {
	if (dryRun) {
		process.stdout.write(`Would create ${plan.files.length} files:\n`);
		for (const file of plan.files) process.stdout.write(`  ${file.path}\n`);
		return;
	}

	await ensureNoConflicts(root, plan.files);
	const result = await create();
	process.stdout.write(`Created ${result.expected.packageExportPath}\n`);
}

async function readAnswers(
	kind: 'component' | 'primitive',
	args: Array<string>,
): Promise<ScaffoldRequest> {
	const cleanedArgs = args.filter((arg) => arg !== '--args' && arg !== '--');
	const dryRun = cleanedArgs.includes('--dry-run');
	const positional = cleanedArgs.filter((arg) => arg !== '--dry-run');
	if (positional.length > 0) {
		const [name, ...options] = positional;
		if (name === undefined || options.length !== 2) {
			throw new Error(
				kind === 'component'
					? 'Usage: pnpm scaffold:component --args <name> <docs-group> <Yes|No> [--dry-run]'
					: 'Usage: pnpm scaffold:primitive --args <name> <Yes|No> <Yes|No> [--dry-run]',
			);
		}
		const [first, second] = options;
		if (kind === 'component') {
			return {
				answers: parseComponentAnswers({
					docsGroup: first,
					name,
					visualCoverage: parseYesNo(second),
				}),
				dryRun,
				kind,
			};
		}
		return {
			answers: parsePrimitiveAnswers({
				docs: parseYesNo(first),
				name,
				visualCoverage: parseYesNo(second),
			}),
			dryRun,
			kind,
		};
	}

	if (!process.stdin.isTTY) {
		throw new Error(
			'Pass scaffold options with --args when running without an interactive terminal.',
		);
	}

	if (kind === 'component') return { answers: await promptAnswers(kind), dryRun, kind };
	return { answers: await promptAnswers(kind), dryRun, kind };
}

async function promptAnswers(kind: 'component'): Promise<CreateComponentInput>;
async function promptAnswers(kind: 'primitive'): Promise<CreatePrimitiveInput>;
async function promptAnswers(
	kind: 'component' | 'primitive',
): Promise<CreateComponentInput | CreatePrimitiveInput> {
	const terminal = createInterface({ input: process.stdin, output: process.stdout });
	let closed = false;
	terminal.on('close', () => {
		closed = true;
	});
	const ask = (prompt: string): Promise<string> => {
		if (closed) return Promise.reject(inputClosedError());
		return new Promise<string>((resolve, reject) => {
			const onClose = () => reject(inputClosedError());
			terminal.once('close', onClose);
			terminal.question(prompt).then(
				(value) => {
					terminal.off('close', onClose);
					resolve(value);
				},
				(error: unknown) => {
					terminal.off('close', onClose);
					reject(closed ? inputClosedError() : error);
				},
			);
		});
	};
	try {
		let name = '';
		for (;;) {
			// eslint-disable-next-line no-await-in-loop -- prompts must be asked one at a time
			name = await ask(
				`${kind === 'component' ? 'Component' : 'Primitive'} name (PascalCase or kebab-case): `,
			);
			const nameCheck =
				kind === 'component' ? validateComponentName(name) : validatePrimitiveName(name);
			if (nameCheck === true) break;
			process.stdout.write(`${nameCheck}\n`);
		}

		if (kind === 'component') {
			const docsGroup = await choose(ask, 'Docs group', DOC_GROUPS, DOC_GROUPS[0]);
			const visualCoverage = await yesNo(
				ask,
				'Add visual coverage?',
				COMPONENT_DEFAULTS.visualCoverage,
			);
			return { docsGroup, name, visualCoverage };
		}

		const docs = await yesNo(ask, 'Add hosted docs?', PRIMITIVE_DEFAULTS.docs);
		const visualCoverage = await yesNo(
			ask,
			'Add visual coverage?',
			PRIMITIVE_DEFAULTS.visualCoverage,
		);
		return { docs, name, visualCoverage };
	} finally {
		terminal.close();
	}
}

async function choose<T extends string>(
	ask: (prompt: string) => Promise<string>,
	label: string,
	choices: ReadonlyArray<T>,
	defaultChoice: T,
): Promise<T> {
	process.stdout.write(
		`${label}: ${choices.map((choice, index) => `${index + 1}) ${choice}`).join('  ')}\n`,
	);
	for (;;) {
		// eslint-disable-next-line no-await-in-loop -- prompts must be asked one at a time
		const answer = await ask(`${label} [${defaultChoice}]: `);
		if (answer === '') return defaultChoice;
		const choice = choices.find((item, index) => item === answer || String(index + 1) === answer);
		if (choice !== undefined) return choice;
		process.stdout.write(`Choose one of: ${choices.join(', ')}\n`);
	}
}

async function yesNo(
	ask: (prompt: string) => Promise<string>,
	label: string,
	defaultValue: boolean,
): Promise<boolean> {
	const defaultLabel = defaultValue ? 'Yes' : 'No';
	for (;;) {
		// eslint-disable-next-line no-await-in-loop -- prompts must be asked one at a time
		const answer = await ask(`${label} (Yes/No) [${defaultLabel}]: `);
		if (answer === '') return defaultValue;
		try {
			return parseYesNo(answer);
		} catch (error) {
			process.stdout.write(`${error instanceof Error ? error.message : String(error)}\n`);
		}
	}
}

function parseYesNo(value: string | undefined): boolean {
	if (value === 'Yes') return true;
	if (value === 'No') return false;
	throw new Error(`Expected Yes or No, received ${String(value)}`);
}

async function ensureNoConflicts(repoRoot: string, files: Array<{ path: string }>): Promise<void> {
	const existingPaths = await Promise.all(
		files.map(async (file) => {
			try {
				await access(path.join(repoRoot, file.path));
				return file.path;
			} catch (error) {
				if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined;
				throw error;
			}
		}),
	);
	const conflict = existingPaths.find((filePath) => filePath !== undefined);
	if (conflict !== undefined)
		throw new Error(`Cannot scaffold because ${conflict} already exists.`);
}
