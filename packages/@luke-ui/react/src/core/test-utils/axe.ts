import axe from 'axe-core';
import { expect } from 'vite-plus/test';

export async function expectNoAxeViolations(container: HTMLElement) {
	const results = await axe.run(container);

	expect(
		results.violations.map((violation) => ({
			id: violation.id,
			nodes: violation.nodes.map((node) => node.html),
		})),
	).toEqual([]);
}
