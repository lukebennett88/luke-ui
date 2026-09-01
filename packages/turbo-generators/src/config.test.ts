import { describe, expect, it } from 'vite-plus/test';
import generator from '../config.js';
import { COMPONENT_DEFAULTS } from './component-creation-plan.js';
import { PRIMITIVE_DEFAULTS } from './primitive-creation-plan.js';

describe('component generator prompts', () => {
	it('uses the plan-owned defaults instead of choice order', () => {
		let prompts: Array<{ default?: unknown; name?: string; type?: string }> | undefined;
		generator({
			setGenerator(_name, config) {
				if (_name !== 'component') return;
				if (!Array.isArray(config.prompts)) {
					throw new Error('Expected static component generator prompts.');
				}
				prompts = config.prompts;
			},
		} as Parameters<typeof generator>[0]);
		if (prompts === undefined) {
			throw new Error('Expected the component generator to register prompts.');
		}

		const conformance = prompts.find((prompt) => prompt.name === 'conformance');
		expect(conformance?.type).toBe('checkbox');
		expect(conformance?.default).toEqual(
			expect.arrayContaining([...COMPONENT_DEFAULTS.conformance]),
		);

		expect({
			conformance: conformance?.default,
			integrationTripwire: prompts.find((prompt) => prompt.name === 'integrationTripwire')?.default,
			visualCoverage: prompts.find((prompt) => prompt.name === 'visualCoverage')?.default,
		}).toEqual(COMPONENT_DEFAULTS);
	});
});

describe('primitive generator prompts', () => {
	it('uses the plan-owned defaults instead of choice order', () => {
		let prompts: Array<{ default?: unknown; name?: string; type?: string }> | undefined;
		generator({
			setGenerator(_name, config) {
				if (_name !== 'primitive') return;
				if (!Array.isArray(config.prompts)) {
					throw new Error('Expected static primitive generator prompts.');
				}
				prompts = config.prompts;
			},
		} as Parameters<typeof generator>[0]);
		if (prompts === undefined) {
			throw new Error('Expected the primitive generator to register prompts.');
		}

		const conformance = prompts.find((prompt) => prompt.name === 'conformance');
		expect(conformance?.type).toBe('checkbox');
		expect(conformance?.default).toEqual(
			expect.arrayContaining([...PRIMITIVE_DEFAULTS.conformance]),
		);
		expect(prompts.find((prompt) => prompt.name === 'docs')?.default).toBe(PRIMITIVE_DEFAULTS.docs);
	});
});
