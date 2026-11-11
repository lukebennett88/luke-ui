import type { HTMLAttributes } from 'react';

interface PlainA {
	/** Object-only branch. */
	a: string;
}

interface PlainB {
	/** Object-only branch. */
	b: number;
}

/** A union of two plain object types. Being a union must not make it DOM-forwarding. */
export type PlainUnionProps = PlainA | PlainB;

interface ElementBranch extends HTMLAttributes<HTMLElement> {
	/** Branch that renders a DOM element and so forwards its attributes. */
	kind: 'element';
}

interface RenderBranch {
	/** Branch that hands rendering to a caller and forwards nothing. */
	kind: 'render';
	render: () => null;
}

/** A union whose element branch forwards DOM props while its render branch does not. */
export type MixedUnionProps = ElementBranch | RenderBranch;
