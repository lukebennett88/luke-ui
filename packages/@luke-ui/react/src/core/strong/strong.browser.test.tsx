import { Strong } from '@luke-ui/react/strong';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';

test('Strong forwards className, data attributes, id, and ref to its element', () => {
	const ref = { current: null as HTMLElement | null };
	const { container } = render(
		<Strong className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			important
		</Strong>,
	);
	const target = container.firstElementChild;
	if (!(target instanceof HTMLElement)) throw new Error('Expected a Strong element.');

	expect(target).toHaveClass('forwarded-class');
	expect(target).toHaveAttribute('data-forwarded', 'true');
	expect(target).toHaveAttribute('id', 'forwarded-id');
	expect(ref.current).toBe(target);
});
