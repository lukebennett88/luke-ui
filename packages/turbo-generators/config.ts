import type { PlopTypes } from '@turbo/gen';
import { createComponent } from './src/apply-component-creation-plan.js';
import { createPrimitive } from './src/apply-primitive-creation-plan.js';
import {
	COMPONENT_DEFAULTS,
	DOC_GROUPS,
	validateComponentName,
} from './src/component-creation-plan.js';
import { PRIMITIVE_DEFAULTS, validatePrimitiveName } from './src/primitive-creation-plan.js';

const YES_NO = [
	{ name: 'Yes', value: true },
	{ name: 'No', value: false },
];

export default function generator(plop: PlopTypes.NodePlopAPI): void {
	plop.setGenerator('component', {
		actions: [
			async (answers) => {
				const plan = await createComponent(process.cwd(), answers);
				return `Created ${plan.expected.packageExportPath}`;
			},
		],
		description: 'Scaffold a new component in @luke-ui/react',
		prompts: [
			{
				message: 'Component name (PascalCase or kebab-case):',
				name: 'name',
				type: 'input',
				validate: validateComponentName,
			},
			{
				choices: [...DOC_GROUPS],
				message: 'Docs group:',
				name: 'docsGroup',
				type: 'list',
			},
			{
				choices: YES_NO,
				default: COMPONENT_DEFAULTS.visualCoverage,
				message: 'Add visual coverage?',
				name: 'visualCoverage',
				type: 'list',
			},
		],
	});
	plop.setGenerator('primitive', {
		actions: [
			async (answers) => {
				const plan = await createPrimitive(process.cwd(), answers);
				return `Created ${plan.expected.packageExportPath}`;
			},
		],
		description: 'Scaffold a new primitive in @luke-ui/react/primitives/*',
		prompts: [
			{
				message: 'Primitive name (PascalCase or kebab-case):',
				name: 'name',
				type: 'input',
				validate: validatePrimitiveName,
			},
			{
				choices: YES_NO,
				default: PRIMITIVE_DEFAULTS.docs,
				message: 'Add hosted docs?',
				name: 'docs',
				type: 'list',
			},
			{
				choices: YES_NO,
				default: PRIMITIVE_DEFAULTS.visualCoverage,
				message: 'Add visual coverage?',
				name: 'visualCoverage',
				type: 'list',
			},
		],
	});
}
