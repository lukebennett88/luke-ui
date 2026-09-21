import { Blockquote } from '@luke-ui/react/blockquote';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';

test('Blockquote forwards className, data attributes, id, and ref to its element', () => {
	const ref = { current: null as HTMLElement | null };
	const { container } = render(
		<Blockquote className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Quoted text
		</Blockquote>,
	);
	const target = container.firstElementChild;
	if (!(target instanceof HTMLElement)) throw new Error('Expected a Blockquote element.');

	expect(target).toHaveClass('forwarded-class');
	expect(target).toHaveAttribute('data-forwarded', 'true');
	expect(target).toHaveAttribute('id', 'forwarded-id');
	expect(ref.current).toBe(target);
});
