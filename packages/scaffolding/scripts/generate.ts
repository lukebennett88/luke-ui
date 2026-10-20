import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
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
	process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
	process.exitCode = 1;
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
	try {
		const name = await terminal.question(
			`${kind === 'component' ? 'Component' : 'Primitive'} name (PascalCase or kebab-case): `,
		);
		const nameCheck =
			kind === 'component' ? validateComponentName(name) : validatePrimitiveName(name);
		if (nameCheck !== true) throw new Error(nameCheck);

		if (kind === 'component') {
			const docsGroup = await choose(terminal, 'Docs group', DOC_GROUPS, DOC_GROUPS[0]);
			const visualCoverage = await yesNo(
				terminal,
				'Add visual coverage?',
				COMPONENT_DEFAULTS.visualCoverage,
			);
			return { docsGroup, name, visualCoverage };
		}

		const docs = await yesNo(terminal, 'Add hosted docs?', PRIMITIVE_DEFAULTS.docs);
		const visualCoverage = await yesNo(
			terminal,
			'Add visual coverage?',
			PRIMITIVE_DEFAULTS.visualCoverage,
		);
		return { docs, name, visualCoverage };
	} finally {
		terminal.close();
	}
}

async function choose<T extends string>(
	terminal: ReturnType<typeof createInterface>,
	label: string,
	choices: ReadonlyArray<T>,
	defaultChoice: T,
): Promise<T> {
	process.stdout.write(
		`${label}: ${choices.map((choice, index) => `${index + 1}) ${choice}`).join('  ')}\n`,
	);
	const answer = await terminal.question(`${label} [${defaultChoice}]: `);
	if (answer === '') return defaultChoice;
	const choice = choices.find((item, index) => item === answer || String(index + 1) === answer);
	if (choice === undefined) throw new Error(`Choose one of: ${choices.join(', ')}`);
	return choice;
}

async function yesNo(
	terminal: ReturnType<typeof createInterface>,
	label: string,
	defaultValue: boolean,
): Promise<boolean> {
	const defaultLabel = defaultValue ? 'Yes' : 'No';
	const answer = await terminal.question(`${label} (Yes/No) [${defaultLabel}]: `);
	return answer === '' ? defaultValue : parseYesNo(answer);
}

function parseYesNo(value: string | undefined): boolean {
	if (value === 'Yes') return true;
	if (value === 'No') return false;
	throw new Error(`Expected Yes or No, received ${String(value)}`);
}

async function ensureNoConflicts(root: string, files: Array<{ path: string }>): Promise<void> {
	const existingPaths = await Promise.all(
		files.map(async (file) => {
			try {
				await access(path.join(root, file.path));
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
