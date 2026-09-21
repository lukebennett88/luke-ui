import { assert, expect } from 'vite-plus/test';

/**
 * Asserts that `className`, `data-forwarded`, `id`, and `ref` all land on the
 * same `target` element.
 *
 * This is the assertion itself, not a conformance framework: which element is
 * the target, and which fixture produces it, stay the caller's job. A
 * component whose contract differs — for example a field that forwards
 * `className`/`data-*` to its root but `id` to an inner control, and forwards
 * no `ref` at all — should not call this helper.
 */
export function expectForwardsDomProps(target: Element, ref: { readonly current: Element | null }) {
	expect(target).toHaveClass('forwarded-class');
	expect(target).toHaveAttribute('data-forwarded', 'true');
	expect(target).toHaveAttribute('id', 'forwarded-id');
	expect(ref.current).toBe(target);
}

/**
 * Narrows `node` to `HTMLElement`, throwing `message` when it is not one.
 *
 * A thin stand-in for the `if (!(x instanceof HTMLElement)) throw ...` guard
 * repeated across DOM-forwarding tests that select their target via
 * `container.firstElementChild`.
 */
export function expectHtmlElement(node: Element | null, message: string): HTMLElement {
	assert(node instanceof HTMLElement, message);
	return node;
}
