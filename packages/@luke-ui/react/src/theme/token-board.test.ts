import { describe, expect, it } from 'vite-plus/test';
import { flattenThemeContract } from './contract.js';
import type { TokenTreeNode } from './token-board.js';
import { buildTokenTree } from './token-board.js';

function collectLeaves(node: TokenTreeNode): Array<{ path: string; varName: string }> {
	if (node.kind === 'leaf') return [{ path: node.path, varName: node.varName }];
	return Object.values(node.children).flatMap(collectLeaves);
}

describe('buildTokenTree', () => {
	it('nests each contract path as groups ending in the matching leaf', () => {
		const contractPairs = flattenThemeContract();
		const tree = buildTokenTree();

		for (const [path, varName] of contractPairs) {
			const segments = path.split('.');
			let node: TokenTreeNode = tree;
			for (const segment of segments.slice(0, -1)) {
				if (node.kind !== 'group') throw new Error(`expected a group on the way to ${path}`);
				const next: TokenTreeNode | undefined = node.children[segment];
				if (next == null) throw new Error(`missing ${segment} for ${path}`);
				node = next;
			}
			if (node.kind !== 'group') throw new Error(`expected a group before ${path}`);
			expect(node.children[segments.at(-1) ?? '']).toEqual({
				kind: 'leaf',
				path,
				varName,
			});
		}

		expect(collectLeaves(tree)).toHaveLength(contractPairs.length);
	});
});
