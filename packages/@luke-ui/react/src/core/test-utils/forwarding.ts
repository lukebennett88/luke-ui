import { assert, expect } from 'vite-plus/test';

export const forwardedDomProps = {
	className: 'forwarded-class',
	'data-forwarded': 'true',
	id: 'forwarded-id',
} as const;

export function expectForwardsDomProps(target: Element, ref: { readonly current: Element | null }) {
	expect(target).toHaveClass(forwardedDomProps.className);
	expect(target).toHaveAttribute('data-forwarded', forwardedDomProps['data-forwarded']);
	expect(target).toHaveAttribute('id', forwardedDomProps.id);
	expect(ref.current).toBe(target);
}

export function expectHtmlElement(node: Element | null, message: string): HTMLElement {
	assert(node instanceof HTMLElement, message);
	return node;
}
