import { Blockquote } from '@luke-ui/react/blockquote';
import { expect, test } from 'vite-plus/test';
import { INTER_CAP_HEIGHT_EM, loadInter } from '../test-utils/load-inter.js';
import { measureBaseline } from '../test-utils/measure-first-line.js';
import { render } from '../test-utils/render.js';

test('Blockquote keeps Capsize trim by default', async () => {
	await loadInter();
	const { locator } = render(
		<div style={{ inlineSize: '16rem' }}>
			<Blockquote data-testid="quote">A trimmed quotation that stays a blockquote.</Blockquote>
		</div>,
	);
	const quote = locator.getByTestId('quote').element();
	const { top } = quote.getBoundingClientRect();
	const firstBaseline = measureBaseline(quote);
	const fontSize = Number.parseFloat(getComputedStyle(quote).fontSize);

	expect(quote.tagName).toBe('BLOCKQUOTE');
	expect(Math.abs(top - (firstBaseline - INTER_CAP_HEIGHT_EM * fontSize))).toBeLessThanOrEqual(0.5);
});
