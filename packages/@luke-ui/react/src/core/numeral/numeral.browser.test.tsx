import { Numeral } from '@luke-ui/react/numeral';
import { createRef } from 'react';
import type { CSSProperties } from 'react';
import { test } from 'vite-plus/test';
import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack } from '../test-utils/visual.js';

test('Numeral forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<Numeral
			className="forwarded-class"
			data-forwarded="true"
			id="forwarded-id"
			ref={ref}
			value={12}
		/>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected a Numeral element.');

	expectForwardsDomProps(target, ref);
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
