import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseBarrel, parseComponent } from '../parse-types.js';

const fixturePath = fileURLToPath(new URL('./fixtures/sample-component.ts', import.meta.url));

describe('parseComponent', () => {
	it('extracts the function description', () => {
		const parsed = parseComponent(fixturePath);
		expect(parsed.description).toContain('Sample composed button with size and tone variants');
	});

	it('extracts @tier JSDoc tag from the props interface', () => {
		const parsed = parseComponent(fixturePath);
		expect(parsed.tier).toBe('composed');
	});

	it('extracts own props (declared on SampleStyleProps) with JSDoc and defaults', () => {
		const parsed = parseComponent(fixturePath);
		const sizeProp = parsed.propsInterface?.members.find((p) => p.name === 'size');
		expect(sizeProp).toMatchObject({
			name: 'size',
			type: "'small' | 'medium'",
			optional: true,
			default: "'medium'",
			description: expect.stringContaining('Controls the button size'),
		});
	});

	it('detects external extends (react-aria-components)', () => {
		const parsed = parseComponent(fixturePath);
		const externalExtends = parsed.propsInterface?.extends.find((e) => e.from === 'external');
		expect(externalExtends?.module).toBe('react-aria-components');
		expect(externalExtends?.typeName).toContain('ButtonProps');
	});
});

const barrelFixturePath = fileURLToPath(new URL('./fixtures/sample-barrel.ts', import.meta.url));

describe('parseBarrel', () => {
	it('reads the file-level JSDoc as the barrel description', () => {
		const parsed = parseBarrel(barrelFixturePath);
		expect(parsed.description).toContain('Sample barrel that re-exports multiple named components');
	});

	it('returns all runtime exports with their names', () => {
		const parsed = parseBarrel(barrelFixturePath);
		const names = parsed.exports.map((e) => e.name);
		expect(names).toContain('SampleWidget');
		expect(names).toContain('SamplePanel');
	});

	it('reads JSDoc descriptions for each export', () => {
		const parsed = parseBarrel(barrelFixturePath);
		const widget = parsed.exports.find((e) => e.name === 'SampleWidget');
		expect(widget?.description).toContain('A sample widget component');
	});

	it('includes a function type signature', () => {
		const parsed = parseBarrel(barrelFixturePath);
		const panel = parsed.exports.find((e) => e.name === 'SamplePanel');
		expect(panel?.type).toMatch(/^function SamplePanel/);
	});
});
