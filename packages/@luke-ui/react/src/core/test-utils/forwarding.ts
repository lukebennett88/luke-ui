import { assert, expect } from 'vite-plus/test';

export function expectForwardsDomProps(target: Element, ref: { readonly current: Element | null }) {
	expect(target).toHaveClass('forwarded-class');
	expect(target).toHaveAttribute('data-forwarded', 'true');
	expect(target).toHaveAttribute('id', 'forwarded-id');
	expect(ref.current).toBe(target);
}

export function expectHtmlElement(node: Element | null, message: string): HTMLElement {
	assert(node instanceof HTMLElement, message);
	return node;
}
