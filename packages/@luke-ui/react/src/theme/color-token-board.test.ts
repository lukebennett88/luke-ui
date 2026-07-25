import { describe, expect, it } from 'vite-plus/test';
import type { ColorTreeNode } from './color-token-board.js';
import { buildColorTree } from './color-token-board.js';
import { flattenThemeContract } from './contract.js';

function collectLeaves(node: ColorTreeNode): Array<{ path: string; varName: string }> {
	if (node.kind === 'leaf') return [{ path: node.path, varName: node.varName }];
	return Object.values(node.children).flatMap(collectLeaves);
}

describe('buildColorTree', () => {
	const colorPairs = flattenThemeContract().filter(([path]) => path.startsWith('color.'));

	it('produces exactly one leaf per color.* contract path, derived from the contract', () => {
		const leaves = collectLeaves(buildColorTree());
		expect(leaves).toHaveLength(colorPairs.length);
	});

	it('carries every contract path and var name through unchanged', () => {
		const byPath = (a: [string, string], b: [string, string]) => a[0].localeCompare(b[0]);
		const leaves = collectLeaves(buildColorTree());
		const leavesByPath = new Map(leaves.map((leaf) => [leaf.path, leaf.varName]));
		expect([...leavesByPath.entries()].sort(byPath)).toEqual([...colorPairs].sort(byPath));
	});

	it('nests a top-level colour leaf directly, with no intermediate group', () => {
		const scrim = buildColorTree().children.scrim;
		expect(scrim).toEqual({ kind: 'leaf', path: 'color.scrim', varName: '--luke-color-scrim' });
	});

	it('nests a deep intent leaf under its full chain of contract path segments', () => {
		const tree = buildColorTree();
		const intent = tree.children.intent;
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
});
