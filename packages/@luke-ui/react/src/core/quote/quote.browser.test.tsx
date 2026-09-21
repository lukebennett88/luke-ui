import { Quote } from '@luke-ui/react/quote';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';

test('Quote forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLQuoteElement>();
	const { container } = render(
		<Quote className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			short quote
		</Quote>,
	);
	const target = container.firstElementChild;
	if (!(target instanceof HTMLElement)) throw new Error('Expected a Quote element.');

	expect(target).toHaveClass('forwarded-class');
	expect(target).toHaveAttribute('data-forwarded', 'true');
	expect(target).toHaveAttribute('id', 'forwarded-id');
	expect(ref.current).toBe(target);
});
