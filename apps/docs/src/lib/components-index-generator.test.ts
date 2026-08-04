import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { generateComponentsIndex } from '../../scripts/generate-components-index.js';
import { componentIndexGroups } from '../generated/components-index.generated.js';

test('generates one runtime entry per component guide', () => {
	const reference = generateComponentsIndex();

	expect(reference).toContain(
		"{ description: 'A labelled control for actions in an interface.', name: 'Button', url: '/components/actions/button' },",
	);
	expect(reference).toContain(
		"{ description: 'Hide content visually and keep it available to assistive technology.', name: 'Visually Hidden', url: '/components/primitives/visually-hidden' },",
	);
	expect(reference).toContain(
		'export const componentIndexGroups: ReadonlyArray<ComponentIndexGroup> = [',
	);
	expect(reference).toContain("title: 'Primitives',");
});

test('groups every entry by category in sidebar order', () => {
	expect(componentIndexGroups.map((group) => group.title)).toEqual([
		'Actions',
		'Feedback',
		'Forms',
		'Layout',
		'Typography',
		'Visuals',
		'Primitives',
	]);
});

test('emits the generated file on disk that the docs app imports', () => {
	const emitted = generateComponentsIndex();

	for (const group of componentIndexGroups) {
		for (const entry of group.entries) {
			expect(emitted).toContain(`url: '${entry.url}'`);
		}
	}

	const emittedPath = resolve(import.meta.dirname, '../generated/components-index.generated.ts');
	expect(readFileSync(emittedPath, 'utf8')).toBe(emitted);
});
