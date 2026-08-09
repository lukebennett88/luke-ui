import type { PlopTypes } from '@turbo/gen';
import * as z from 'zod';
import { applyComponentCreationPlan } from './src/apply-component-creation-plan.js';
import type { CreateComponentInput } from './src/component-creation-plan.js';
import { createComponentPlan } from './src/component-creation-plan.js';

const COMPONENT_NAME_RE = /^[A-Za-z][A-Za-z0-9-]*$/;
const COMPONENT_TIERS = ['atom', 'composed'] as const;
const COMPONENT_STYLING = ['none', 'recipe'] as const;
const CONFORMANCE_TIERS = ['universal', 'field-shaped', 'none'] as const;
// Mirrors apps/docs/content/docs/components/*/meta.json — the pages listed there.
const DOC_GROUPS = ['actions', 'feedback', 'forms', 'typography', 'visuals'] as const;

const componentAnswersSchema = z.object({
	docsGroup: z.enum(DOC_GROUPS),
	name: z.string().min(1),
	styling: z.enum(COMPONENT_STYLING),
	tier: z.enum(COMPONENT_TIERS),
	conformanceTier: z.enum(CONFORMANCE_TIERS).default('universal'),
	integrationTripwire: z.boolean().default(false),
	visualCoverage: z.boolean().default(true),
});

export default function generator(plop: PlopTypes.NodePlopAPI): void {
	plop.setGenerator('component', {
		actions: [
			async (answers) => {
				const input = parseComponentAnswers(answers);
				const plan = createComponentPlan(input);
				await applyComponentCreationPlan(process.cwd(), plan);
				return `Created ${plan.expected.packageExportPath}`;
			},
		],
		description: 'Scaffold new Atom or Composed component in @luke-ui/react',
		prompts: [
			{
				message: 'Component name (PascalCase or kebab-case):',
				name: 'name',
				type: 'input',
				validate: validateComponentName,
			},
			{
				choices: [
					{ name: 'Atom', value: 'atom' },
					{ name: 'Composed', value: 'composed' },
				],
				message: 'Component tier:',
				name: 'tier',
				type: 'list',
			},
			{
				choices: [...DOC_GROUPS],
				message: 'Docs group:',
				name: 'docsGroup',
				type: 'list',
			},
			{
				choices: [
					{ name: 'Recipe', value: 'recipe' },
					{ name: 'None', value: 'none' },
				],
				message: 'Styling:',
				name: 'styling',
				type: 'list',
			},
			{
				choices: [
					{ name: 'Yes', value: true },
					{ name: 'No', value: false },
				],
				message: 'Add visual coverage?',
				name: 'visualCoverage',
				type: 'list',
			},
			{
				choices: [
					{ name: 'Universal', value: 'universal' },
					{ name: 'Field-shaped', value: 'field-shaped' },
					{ name: 'None', value: 'none' },
				],
				message: 'Conformance tier:',
				name: 'conformanceTier',
				type: 'list',
			},
			{
				choices: [
					{ name: 'Yes', value: true },
					{ name: 'No', value: false },
				],
				message: 'Add an integration tripwire?',
				name: 'integrationTripwire',
				type: 'list',
			},
		],
	});
}

export function parseComponentAnswers(answers: unknown): CreateComponentInput {
	return componentAnswersSchema.parse(answers);
}

function validateComponentName(value: unknown): true | string {
	if (typeof value !== 'string') {
		return 'Component name required.';
	}
	const trimmed = value.trim();
	if (!trimmed) {
		return 'Component name required.';
	}
	if (!COMPONENT_NAME_RE.test(trimmed)) {
		return 'Use letters/numbers/hyphens. Start with a letter.';
	}
	return true;
}
