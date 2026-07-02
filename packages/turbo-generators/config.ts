import type { PlopTypes } from '@turbo/gen';
import { applyComponentCreationPlan } from './src/apply-component-creation-plan.js';
import type {
	ComponentStyling,
	ComponentTier,
	CreateComponentInput,
} from './src/component-creation-plan.js';
import { createComponentPlan } from './src/component-creation-plan.js';

const DOCS_GROUPS = ['actions', 'feedback', 'forms', 'typography', 'visuals'] as const;
const COMPONENT_NAME_RE = /^[A-Za-z][A-Za-z0-9-]*$/;

interface ComponentAnswers {
	docsGroup?: string;
	name?: string;
	styling?: ComponentStyling;
	tier?: ComponentTier;
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
	plop.setGenerator('component', {
		actions: [
			async (answers) => {
				const input = toComponentInput(answers as ComponentAnswers);
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
				choices: [...DOCS_GROUPS],
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
		],
	});
}

function toComponentInput(answers: ComponentAnswers): CreateComponentInput {
	if (!answers.name) {
		throw new Error('Component name required.');
	}
	if (!answers.tier) {
		throw new Error('Component tier required.');
	}
	if (!answers.docsGroup) {
		throw new Error('Docs group required.');
	}
	if (!answers.styling) {
		throw new Error('Styling required.');
	}
	return {
		docsGroup: answers.docsGroup,
		name: answers.name,
		styling: answers.styling,
		tier: answers.tier,
	};
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
