import type { PlopTypes } from '@turbo/gen';
import { createComponent } from './src/apply-component-creation-plan.js';
import type { ConformanceTier } from './src/component-creation-plan.js';
import {
	CONFORMANCE_TIERS,
	DOC_GROUPS,
	validateComponentName,
} from './src/component-creation-plan.js';

const CONFORMANCE_TIER_LABELS: Record<ConformanceTier, string> = {
	'field-shaped': 'Field-shaped',
	none: 'None',
	universal: 'Universal',
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
				message: 'Add visual coverage?',
				name: 'visualCoverage',
				type: 'list',
			},
			{
				choices: CONFORMANCE_TIERS.map((tier) => ({
					name: CONFORMANCE_TIER_LABELS[tier],
					value: tier,
				})),
				message: 'Conformance tier:',
				name: 'conformanceTier',
				type: 'list',
			},
			{
				choices: YES_NO,
				message: 'Add an integration tripwire?',
				name: 'integrationTripwire',
				type: 'list',
			},
		],
	});
}
