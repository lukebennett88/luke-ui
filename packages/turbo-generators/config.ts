import type { PlopTypes } from '@turbo/gen';
import { createComponent } from './src/apply-component-creation-plan.js';
import type { ConformanceContract } from './src/component-creation-plan.js';
import {
	COMPONENT_DEFAULTS,
	CONFORMANCE_CONTRACTS,
	DOC_GROUPS,
	validateComponentName,
} from './src/component-creation-plan.js';

const CONFORMANCE_CONTRACT_LABELS: Record<ConformanceContract, string> = {
	dom: 'DOM',
	field: 'Field',
};

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
			{
				choices: CONFORMANCE_CONTRACTS.map((contract) => ({
					name: CONFORMANCE_CONTRACT_LABELS[contract],
					value: contract,
				})),
				default: [...COMPONENT_DEFAULTS.conformance],
				message: 'Conformance contracts:',
				name: 'conformance',
				type: 'checkbox',
			},
			{
				choices: YES_NO,
				default: COMPONENT_DEFAULTS.integrationTripwire,
				message: 'Add an integration tripwire?',
				name: 'integrationTripwire',
				type: 'list',
			},
		],
	});
}
