import { describe, expect, it } from 'vite-plus/test';
import { parseGenerateArgs } from './generate-component-args.js';

describe('parseGenerateArgs', () => {
	it('keeps the interactive path when --args is absent', () => {
		expect(parseGenerateArgs([])).toEqual({ kind: 'interactive' });
	});

	it('reads name and docs group from --args', () => {
		expect(parseGenerateArgs(['--args', 'ThrowawayProbe', 'visuals'])).toEqual({
			answers: { docsGroup: 'visuals', name: 'ThrowawayProbe' },
			kind: 'args',
		});
	});

	it('rejects a missing docs group', () => {
		expect(() => parseGenerateArgs(['--args', 'ThrowawayProbe'])).toThrow(
			'Usage: generate:component --args <name> <docs-group>',
		);
	});

	it('rejects extra positional args', () => {
		expect(() => parseGenerateArgs(['--args', 'ThrowawayProbe', 'visuals', 'true'])).toThrow(
			'Usage: generate:component --args <name> <docs-group>',
		);
	});
});
