/** Shared alias that both union branches declare. */
export type SharedBranchAlias = string | number;

/** Callable alias declared only on the render branch. */
export type BranchRenderProp = (props: { className?: string }) => null;

interface ElementBranch {
	elementType?: 'div' | 'span';
	/** Exclusive to the element branch — must not win over the render annotation. */
	renderRoot?: never;
	shared?: SharedBranchAlias;
}

interface RenderBranch {
	elementType?: never;
	renderRoot: BranchRenderProp;
	shared?: SharedBranchAlias;
}

/**
 * Mirrors Box-like element/render exclusivity: the first union branch declares `renderRoot?: never`,
 * so a first-wins annotation picker would document `never` instead of the real render prop.
 */
export type UnionBranchDocProps = ElementBranch | RenderBranch;
