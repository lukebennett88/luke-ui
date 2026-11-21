import { describe, expect, test } from 'vite-plus/test';
import type { Capture } from '../report/schema.js';
import { describeShare, exampleLabel, groupExamples, hasThemes, themeLabel } from './examples.js';

function capture(id: string, overrides: Partial<Capture> = {}): Capture {
	const [component = '', name = ''] = id.split('/');
	return { component, id, name, status: 'changed', ...overrides };
}

describe('groupExamples', () => {
	test('puts each theme of an example in one group, Paper before Tactile and light before dark', () => {
		const examples = groupExamples([
			capture('button/primary-paper-dark'),
			capture('button/primary-paper-light'),
			capture('button/primary-tactile-dark'),
			capture('button/primary-tactile-light'),
			capture('button/secondary-paper-dark'),
		]);

		expect(examples.map((example) => example.id)).toEqual(['button/primary', 'button/secondary']);
		expect(examples[0]?.captures.map((item) => item.id)).toEqual([
			'button/primary-paper-light',
			'button/primary-paper-dark',
			'button/primary-tactile-light',
			'button/primary-tactile-dark',
		]);
		expect(examples[0]).toMatchObject({ component: 'button', name: 'primary' });
	});

	test('keeps examples with the same name apart when their components differ', () => {
		const examples = groupExamples([
			capture('button/states-paper-light'),
			capture('checkbox/states-paper-light'),
		]);

		expect(examples.map((example) => example.id)).toEqual(['button/states', 'checkbox/states']);
	});

	test('makes a capture with no theme an example of its own', () => {
		const [example] = groupExamples([capture('text/added-case', { status: 'added' })]);

		expect(example?.id).toBe('capture:text/added-case');
		expect(example && hasThemes(example)).toBe(false);
	});

	test('keeps a capture with no theme apart from a themed example of the same name', () => {
		const examples = groupExamples([
			capture('button/primary'),
			capture('button/primary-paper-light'),
		]);

		expect(examples.map((example) => example.captures.map((item) => item.id))).toEqual([
			['button/primary'],
			['button/primary-paper-light'],
		]);
		expect(new Set(examples.map((example) => example.id)).size).toBe(2);
	});
});

describe('labels', () => {
	test('names the theme and the example in view', () => {
		const dark = capture('button/primary-flat-dark');
		const [example] = groupExamples([dark]);

		expect(themeLabel(dark)).toBe('Flat dark');
		expect(example && exampleLabel(example, dark)).toBe('primary · Flat dark');
	});

	test('describes how much of a changed capture differs', () => {
		const sizes = { height: 100, width: 100 };

		expect(describeShare(capture('a/b', { ...sizes, mismatchedPixels: 42 }))).toBe('0.42%');
		expect(describeShare(capture('a/b', { ...sizes, mismatchedPixels: 0 }))).toBe('0%');
		expect(describeShare(capture('a/b', { height: 1000, mismatchedPixels: 1, width: 1000 }))).toBe(
			'under 0.01%',
		);
		expect(describeShare(capture('a/b', { status: 'added' }))).toBe('Added');
	});
});
