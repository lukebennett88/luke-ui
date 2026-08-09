import type { ComponentProps, ComponentType, CSSProperties, ReactNode } from 'react';
import { expect } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/context';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import type { VisualAppearance } from './render.js';

/** Captures a named scene into the revision output selected by the visual runner. */
export async function captureVisual(locator: Locator, id: string) {
	if (!/^[a-z0-9-]+\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
		throw new Error(`Visual capture IDs must use a component namespace: ${id}`);
	}
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;
	const viewport = `${viewportWidth}x${viewportHeight}`;
	const element = locator.element();
	const fullHeight = element.scrollHeight;
	const isTall = fullHeight > viewportHeight;

	if (isTall) {
		// Vitest browser mode renders the test inside an iframe sized to the
		// configured viewport; growing only the top-level page (via CDP) leaves
		// the iframe's own box unchanged, so it never paints past its original
		// height. `page.viewport` resizes and re-lays-out the iframe itself, so
		// both must grow together for the revealed region to paint.
		await cdp().send('Emulation.setDeviceMetricsOverride', {
			width: viewportWidth,
			height: fullHeight,
			deviceScaleFactor: window.devicePixelRatio,
			mobile: false,
		});
		await page.viewport(viewportWidth, fullHeight);
	}

	await expect.element(locator).toMatchScreenshot(`${id}__viewport-${viewport}`);

	if (isTall) {
		await page.viewport(viewportWidth, viewportHeight);
		await cdp().send('Emulation.clearDeviceMetricsOverride');
	}
}

/** Captures one look with a stable identity-and-mode suffix added to `id`. */
export async function captureVisualAppearance(
	locator: Locator,
	id: string,
	appearance: VisualAppearance,
) {
	await captureVisual(locator, `${id}-${appearance.theme}-${appearance.mode}`);
}

/** Emulates Chromium forced colours for a visual scene. */
export async function emulateForcedColors(value: 'active' | 'none') {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'forced-colors', value }],
	});
}

/** The CDP DOM node shape, inferred from `DOM.getDocument`'s own response type. */
type CdpDomNode = Awaited<ReturnType<typeof getCdpDomRoot>>;

/** Fetches the CDP DOM tree root, piercing into the Vitest iframe and any shadow roots. */
async function getCdpDomRoot() {
	const { root } = await cdp().send('DOM.getDocument', { depth: -1, pierce: true });
	return root;
}

/** Reads one attribute from a CDP DOM node's flat `[name1, value1, name2, value2, …]` array. */
function cdpAttribute(node: CdpDomNode, name: string): string | undefined {
	const attributes = node.attributes ?? [];
	for (let index = 0; index < attributes.length; index += 2) {
		if (attributes[index] === name) return attributes[index + 1];
	}
	return undefined;
}

/**
 * Depth-first search for a CDP DOM node with the given attribute value, piercing into
 * iframe content documents and shadow roots, returning it alongside its immediate
 * parent. Standard DOM APIs give a test no way to identify a live element's own CDP
 * node, so callers that need one (to reach a `::after` pseudo-element's box model, see
 * `pseudoElementLeft`) look their element up by a known attribute instead of a JS
 * reference.
 */
function findCdpNodeWithParent(
	node: CdpDomNode,
	attribute: string,
	value: string,
	parent?: CdpDomNode,
): { node: CdpDomNode; parent?: CdpDomNode } | undefined {
	if (cdpAttribute(node, attribute) === value) return { node, parent };
	for (const child of node.children ?? []) {
		const found = findCdpNodeWithParent(child, attribute, value, node);
		if (found != null) return found;
	}
	if (node.contentDocument != null) {
		const found = findCdpNodeWithParent(node.contentDocument, attribute, value, node);
		if (found != null) return found;
	}
	for (const shadowRoot of node.shadowRoots ?? []) {
		const found = findCdpNodeWithParent(shadowRoot, attribute, value, node);
		if (found != null) return found;
	}
	return undefined;
}

/**
 * Returns the rendered left edge (border box, viewport coordinates) of a `::after`
 * pseudo-element, found by looking up a descendant with a known attribute/value pair
 * (typically a control's own input, via its `name`) and reading its parent's own
 * `::after` from the CDP DOM domain's `pseudoElements`.
 *
 * `getBoundingClientRect` cannot target a pseudo-element — there is no live DOM node
 * for one — so this is the only way to measure where a CSS-drawn invalid-indicator icon
 * (`invalidIndicatorIcon`, drawn as its host's `::after`) actually renders, rather than
 * trusting the CSS declarations that are supposed to place it there. Used by Combobox
 * to assert the icon lands before its clear button and trigger instead of after them.
 * `InputGroup` draws the same glyph as a real `Icon` element, so its own ordering test
 * reads a plain `getBoundingClientRect` instead.
 */
export async function pseudoElementLeft(
	descendantAttribute: string,
	descendantValue: string,
): Promise<number> {
	const root = await getCdpDomRoot();
	const found = findCdpNodeWithParent(root, descendantAttribute, descendantValue);
	if (found?.parent == null) {
		throw new Error(
			`Could not find a CDP DOM node for ${descendantAttribute}="${descendantValue}" with a parent.`,
		);
	}

	const pseudoNode = found.parent.pseudoElements?.find(
		(candidate) => candidate.pseudoType === 'after',
	);
	if (pseudoNode == null) {
		throw new Error(
			`Expected a "::after" pseudo-element on the parent of ${descendantAttribute}="${descendantValue}".`,
		);
	}

	const { model } = await cdp().send('DOM.getBoxModel', { nodeId: pseudoNode.nodeId });
	// `border` is a clockwise quad `[x1, y1, x2, y2, x3, y3, x4, y4]` starting at the
	// top-left corner, so index 0 is the border box's left edge.
	const left = model.border[0];
	if (left == null) throw new Error('Expected the pseudo-element border quad to have a left edge.');
	return left;
}

/**
 * The non-nullable union of values a component accepts for `Prop`, for building
 * variant arrays without repeating `NonNullable<SomeProps['x']>`. For example
 * `PropOptions<typeof Button, 'tone'>`.
 */
export type PropOptions<
	Component extends ComponentType<any>,
	Prop extends keyof ComponentProps<Component>,
> = NonNullable<ComponentProps<Component>[Prop]>;

/**
 * Constrains `values` to valid prop values for `Component[Prop]` and returns
 * the exact tuple type. Replaces the `as const satisfies ReadonlyArray<PropOptions<…>>`
 * pattern.
 *
 * @example
 * const tones = variantValuesFor<typeof Button, 'tone'>()(['neutral', 'accent', 'danger']);
 */
export function variantValuesFor<
	Component extends ComponentType<any>,
	Prop extends keyof ComponentProps<Component>,
>() {
	return <const T extends ReadonlyArray<PropOptions<Component, Prop>>>(values: T): T => values;
}

const SCENE_GAP = '1rem';
const SCENE_PADDING = '1rem';

/**
 * Vertical scene with consistent padding and gap, for form-like components.
 * Children stretch to `width` by default; pass `align="flex-start"` for content
 * that should hug its own size (e.g. buttons, links, inline placeholders).
 */
export function Stack({
	children,
	align,
	width = '24rem',
}: {
	children: ReactNode;
	align?: CSSProperties['alignItems'];
	width?: string;
}) {
	return (
		<div
			style={{
				alignItems: align,
				display: 'flex',
				flexDirection: 'column',
				gap: SCENE_GAP,
				padding: SCENE_PADDING,
				width,
			}}
		>
			{children}
		</div>
	);
}

/** Grid scene with consistent padding and gap, for laying out many variants. */
export function Grid({ children, columns }: { children: ReactNode; columns: number }) {
	return (
		<div
			style={{
				alignItems: 'center',
				display: 'grid',
				gap: SCENE_GAP,
				gridTemplateColumns: `repeat(${columns}, max-content)`,
				padding: SCENE_PADDING,
				width: 'max-content',
			}}
		>
			{children}
		</div>
	);
}

/**
 * Moves keyboard focus to `target` by tabbing, so the browser applies
 * `:focus-visible` (which a programmatic `.focus()` would not), and asserts focus
 * landed. Follow with `captureVisual` on the scene to capture the focus ring.
 */
export async function focusViaKeyboard(target: Locator) {
	await userEvent.tab();
	await expect.element(target).toHaveFocus();
}
