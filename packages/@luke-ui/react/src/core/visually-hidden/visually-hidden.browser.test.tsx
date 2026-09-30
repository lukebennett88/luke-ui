import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { expect, test } from 'vite-plus/test';
import { expectHtmlElement } from '../test-utils/forwarding.js';
import { render } from '../test-utils/render.js';

test('VisuallyHidden clips content visually while keeping it in the accessibility tree', () => {
	const { locator } = render(<VisuallyHidden>Hidden label</VisuallyHidden>);
	const target = expectHtmlElement(
		locator.getByText('Hidden label').element(),
		'Expected a VisuallyHidden element.',
	);
	const styles = getComputedStyle(target);

	expect(target.tagName).toBe('SPAN');
	expect(styles.blockSize).toBe('1px');
	expect(styles.inlineSize).toBe('1px');
	expect(styles.overflow).toBe('hidden');
	expect(styles.position).toBe('absolute');
	expect(styles.clipPath).not.toBe('none');
});

test('VisuallyHidden keeps the requested heading semantics', () => {
	const { locator } = render(<VisuallyHidden elementType="h2">Hidden heading</VisuallyHidden>);
	const heading = locator.getByRole('heading', { level: 2, name: 'Hidden heading' }).element();

	expect(heading.tagName).toBe('H2');
});
