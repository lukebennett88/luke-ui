import type { TypeNode } from '@fumadocs/story/type-tree';

export function reorderProps(priorities: Array<string>): (node: TypeNode) => TypeNode {
	const prioritySet = new Set(priorities);

	return (node: TypeNode) => {
		if (node.type !== 'object') return node;
		const props = node.properties;

		const byName = new Map(props.map((p) => [p.name, p]));

		const result: Array<(typeof props)[number]> = [];
		for (const name of priorities) {
			const p = byName.get(name);
			if (p !== undefined) result.push(p);
		}

		for (const p of props) {
			if (!prioritySet.has(p.name)) result.push(p);
		}

		return { ...node, properties: result };
	};
}
