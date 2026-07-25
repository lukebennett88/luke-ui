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

	it('nests a top-level colour leaf under its family group, with no intermediate group', () => {
		const tree = buildTokenTree();
		const color = tree.children.color;
		if (color?.kind !== 'group') throw new Error('expected a color group');
		expect(color.children.scrim).toEqual({
			kind: 'leaf',
			path: 'color.scrim',
			varName: '--luke-color-scrim',
		});
	});

	it('nests a deep intent leaf under its full chain of contract path segments', () => {
		const tree = buildTokenTree();
		const color = tree.children.color;
		if (color?.kind !== 'group') throw new Error('expected a color group');
		const intent = color.children.intent;
		if (intent?.kind !== 'group') throw new Error('expected an intent group');
		const danger = intent.children.danger;
		if (danger?.kind !== 'group') throw new Error('expected a danger group');
		const surface = danger.children.surface;
		if (surface?.kind !== 'group') throw new Error('expected a surface group');

		expect(surface.children.subtle).toEqual({
			kind: 'leaf',
			path: 'color.intent.danger.surface.subtle',
			varName: '--luke-color-intent-danger-surface-subtle',
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

		expect(duration.children.fast).toEqual({
			kind: 'leaf',
			path: 'motion.duration.fast',
			varName: '--luke-motion-duration-fast',
		});
	});
});
