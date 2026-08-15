import { describe, expect, it } from 'vite-plus/test';
import { flattenThemeContract } from './contract.js';
import type { TokenTreeNode } from './token-board.js';
import { buildTokenTree } from './token-board.js';

function collectLeaves(node: TokenTreeNode): Array<{ path: string; varName: string }> {
	if (node.kind === 'leaf') return [{ path: node.path, varName: node.varName }];
	return Object.values(node.children).flatMap(collectLeaves);
}

describe('buildTokenTree', () => {
	const contractPairs = flattenThemeContract();

	it('produces exactly one leaf per contract path, derived from the contract', () => {
		const leaves = collectLeaves(buildTokenTree());
		expect(leaves).toHaveLength(contractPairs.length);
	});

	it('carries every contract path and var name through unchanged', () => {
		const byPath = (a: [string, string], b: [string, string]) => a[0].localeCompare(b[0]);
		const leaves = collectLeaves(buildTokenTree());
		const leavesByPath = new Map(leaves.map((leaf) => [leaf.path, leaf.varName]));
		expect([...leavesByPath.entries()].sort(byPath)).toEqual([...contractPairs].sort(byPath));
	});

	it('nests overlay colour leaves under the overlay group', () => {
		const tree = buildTokenTree();
		const color = tree.children.color;
		if (color?.kind !== 'group') throw new Error('expected a color group');
		expect(color.children.overlay).toEqual({
			kind: 'group',
			children: {
				backdrop: {
					kind: 'leaf',
					path: 'color.overlay.backdrop',
					varName: '--luke-color-overlay-backdrop',
				},
				hover: {
					kind: 'leaf',
					path: 'color.overlay.hover',
					varName: '--luke-color-overlay-hover',
				},
				pressed: {
					kind: 'leaf',
					path: 'color.overlay.pressed',
					varName: '--luke-color-overlay-pressed',
				},
			},
		});
	});

	it('nests a flattened semantic-role background leaf under its contract path segments', () => {
		// `color.background.<role>.subtle` is a string leaf after hover/pressed ramps were removed.
		const tree = buildTokenTree();
		const color = tree.children.color;
		if (color?.kind !== 'group') throw new Error('expected a color group');
		const background = color.children.background;
		if (background?.kind !== 'group') throw new Error('expected a background group');
		const danger = background.children.danger;
		if (danger?.kind !== 'group') throw new Error('expected a danger group');

		expect(danger.children.subtle).toEqual({
			kind: 'leaf',
			path: 'color.background.danger.subtle',
			varName: '--luke-color-background-danger-subtle',
		});
	});

	it('groups every non-colour family at the top level too', () => {
		const tree = buildTokenTree();
		const nonColorFamilies = new Set(
			contractPairs
				.map(([path]) => path.split('.')[0])
				.filter((family): family is string => family !== undefined && family !== 'color'),
		);
		for (const family of nonColorFamilies) {
			expect(Object.keys(tree.children)).toContain(family);
		}
	});

	it('nests a motion leaf under its duration or easing group', () => {
		const tree = buildTokenTree();
		const motion = tree.children.motion;
		if (motion?.kind !== 'group') throw new Error('expected a motion group');
		const duration = motion.children.duration;
		if (duration?.kind !== 'group') throw new Error('expected a duration group');

		expect(duration.children.feedback).toEqual({
			kind: 'leaf',
			path: 'motion.duration.feedback',
			varName: '--luke-motion-duration-feedback',
		});
	});
});
