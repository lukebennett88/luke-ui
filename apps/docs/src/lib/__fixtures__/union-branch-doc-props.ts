/** Shared alias that both union branches declare. */
export type SharedBranchAlias = string | number;

/** Callable alias declared only on the render branch. */
export type BranchRenderProp = (props: { className?: string }) => null;

/** Distinct valid alias on the element branch only. */
export type ElementMode = 'element';

/** Distinct valid alias on the render branch only. */
export type RenderMode = 'render';

interface ElementBranch {
	elementType?: 'div' | 'span';
	/** Exclusive to the element branch — must not win over the render annotation. */
	renderRoot?: never;
	shared?: SharedBranchAlias;
	/** Distinct valid annotation — must not narrow to a single branch's type. */
	mode?: ElementMode;
}

interface RenderBranch {
	elementType?: never;
	renderRoot: BranchRenderProp;
	shared?: SharedBranchAlias;
	mode?: RenderMode;
}

/**
 * Mirrors Box-like element/render exclusivity: the first union branch declares `renderRoot?: never`,
 * so a first-wins annotation picker would document `never` instead of the real render prop.
 * `mode` is declared as different valid aliases on each branch, so docs must cover both.
 */
export type UnionBranchDocProps = ElementBranch | RenderBranch;
