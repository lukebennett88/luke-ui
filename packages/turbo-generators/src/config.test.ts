import { describe, expect, it } from 'vite-plus/test';
import generator from '../config.js';
import { COMPONENT_DEFAULTS } from './component-creation-plan.js';

describe('component generator prompts', () => {
	it('uses the plan-owned defaults instead of choice order', () => {
		let prompts: Array<{ default?: unknown; name?: string }> | undefined;
		generator({
			setGenerator(_name, config) {
				if (!Array.isArray(config.prompts)) {
					throw new Error('Expected static component generator prompts.');
				}
				prompts = config.prompts;
			},
		} as Parameters<typeof generator>[0]);
		if (prompts === undefined) {
			throw new Error('Expected the component generator to register prompts.');
		}

		expect({
			conformanceTier: prompts.find((prompt) => prompt.name === 'conformanceTier')?.default,
			integrationTripwire: prompts.find((prompt) => prompt.name === 'integrationTripwire')?.default,
			visualCoverage: prompts.find((prompt) => prompt.name === 'visualCoverage')?.default,
		}).toEqual({ ...COMPONENT_DEFAULTS, conformanceTier: 'this-is-a-deliberately-wrong-value' });
	});
});
