import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';

test('VisuallyHidden forwards className, data attributes, id, and ref to its element', () => {
	const ref = { current: null as HTMLElement | null };
	const { container } = render(
		<VisuallyHidden className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Hidden label
		</VisuallyHidden>,
	);
	const target = container.firstElementChild;
	if (!(target instanceof HTMLElement)) throw new Error('Expected a VisuallyHidden element.');

	expect(target).toHaveClass('forwarded-class');
	expect(target).toHaveAttribute('data-forwarded', 'true');
	expect(target).toHaveAttribute('id', 'forwarded-id');
	expect(ref.current).toBe(target);
});
