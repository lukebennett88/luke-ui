import axe from 'axe-core';
import { expect } from 'vite-plus/test';

/**
 * Runs axe over `container` and fails with the rule IDs and offending markup.
 *
 * This is the call into axe, not an accessibility framework: a component's own
 * expectations belong in its test file alongside its other assertions.
 *
 * `color-contrast` runs. Vitest browser mode's iframe does not defeat it: the
 * theme root sets its own background, so axe resolves foreground and background
 * and scores them. Where a surface paints a gradient (tactile's high-prominence
 * controls), axe reports the node as `incomplete` rather than a violation, which
 * is a limitation of the rule rather than a false positive, so it does not fail.
 */
export async function expectNoAxeViolations(container: HTMLElement) {
	const results = await axe.run(container);

	expect(
		results.violations.map((violation) => ({
			id: violation.id,
			nodes: violation.nodes.map((node) => node.html),
		})),
	).toEqual([]);
}
