import { Numeral } from '@luke-ui/react/numeral';
import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack } from '../test-utils/visual.js';

test('Numeral forwards className, data attributes, id, and ref to its element', () => {
	const ref = { current: null as HTMLElement | null };
	const { container } = render(
		<Numeral
			className="forwarded-class"
			data-forwarded="true"
			id="forwarded-id"
			ref={ref}
			value={12}
		/>,
	);
	const target = container.firstElementChild;
	if (!(target instanceof HTMLElement)) throw new Error('Expected a Numeral element.');

	expect(target).toHaveClass('forwarded-class');
	expect(target).toHaveAttribute('data-forwarded', 'true');
	expect(target).toHaveAttribute('id', 'forwarded-id');
	expect(ref.current).toBe(target);
});

const rowStyle = {
	display: 'flex',
	gap: '1.5rem',
} satisfies CSSProperties;

test('formats and typography', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack>
				<div style={rowStyle}>
					<Numeral value={120_000} />
					<Numeral abbreviate value={120_000} />
					<Numeral abbreviate="long" value={120_000} />
				</div>
				<div style={rowStyle}>
					<Numeral currency="AUD" precision={2} value={98.7654} />
					<Numeral format="percent" precision={1} value={0.982} />
					<Numeral unit="kilometer-per-hour" value={98} />
				</div>
				<div style={{ inlineSize: '10rem' } satisfies CSSProperties}>
					<Numeral
						color="accent"
						fontWeight="emphasis"
						textAlign="end"
						typography="heading3"
						value={12_345.67}
					/>
				</div>
			</Stack>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'numeral/formats-typography', appearance);
	}
});
