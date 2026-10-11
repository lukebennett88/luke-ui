import path from 'node:path';
import { precomputeValues } from '@capsizecss/core';
import interMetrics from '@capsizecss/metrics/inter';
import type { Browser, Page } from 'playwright';
import { chromium } from 'playwright';
import { afterAll, beforeAll, describe, expect, inject, test } from 'vite-plus/test';
import { capsizeTrimVarName } from '../../theme/capsize-trim-vars.js';
import { FONT_METRIC_SCALE } from '../../theme/font-metric-scale.js';
import { typeStyleFontRole, typeStyleMetricStep, typeStyles } from '../../theme/type-styles.js';
import { serveBuild } from './environment.js';
import { LORA_METRICS } from './theme-fixture.js';

const { consumers, themes } = inject('packedConsumer');
// Font rendering depends on the browser, not on the peer versions, so one consumer is enough.
const consumer = consumers.find((candidate) => !candidate.isLowest);
if (consumer === undefined) throw new Error('Expected a consumer with the newest peers.');

describe.skipIf(themes.length === 0)('fonts in a production build', () => {
	let browser: Browser;
	let server: Awaited<ReturnType<typeof serveBuild>>;

	beforeAll(async () => {
		server = await serveBuild(consumer.dir);
		browser = await chromium.launch();
	});

	afterAll(async () => {
		await browser.close();
		await server.close();
	});

	// Tactile loads its own stylesheet. The product theme extends Paper and loads only Paper's fonts.
	for (const file of ['tactile.html', 'product.html']) {
		test(`renders the Inter a theme package ships on ${file}`, async () => {
			const { fontResponses, page } = await openFontPage(browser, `${server.url}${file}`);
			expect(fontResponses).toEqual([{ font: 'inter', status: 200 }]);
			expect(await renderedFonts(page, '#body-text')).toEqual(['Inter']);
		});
	}

	test('renders a display font with the trims Capsize computes for it', async () => {
		const { fontResponses, page } = await openFontPage(browser, `${server.url}display.html`);
		expect([...fontResponses].sort((a, b) => a.font.localeCompare(b.font))).toEqual([
			{ font: 'inter', status: 200 },
			{ font: 'lora', status: 200 },
		]);
		expect(await renderedFonts(page, '#body-text')).toEqual(['Inter']);
		expect(await renderedFonts(page, '#display-text')).toEqual(['Lora']);

		const trimNames = typeStyles.flatMap((style) => [
			capsizeTrimVarName(style, 'baselineTrim'),
			capsizeTrimVarName(style, 'capHeightTrim'),
		]);
		const trims = await page.evaluate((names) => {
			const styles = getComputedStyle(document.documentElement);
			return Object.fromEntries(names.map((name) => [name, styles.getPropertyValue(name).trim()]));
		}, trimNames);
		// The production build minifies CSS, so compare the lengths, not their spelling.
		expect(emValues(trims)).toEqual(emValues(expectedDisplayFixtureTrims()));
	});
});

/** Opens a page, waits for its fonts, and records each font file it requests. */
async function openFontPage(browser: Browser, url: string) {
	const page = await browser.newPage();
	const fontResponses: Array<{ font: string; status: number }> = [];
	page.on('response', (response) => {
		const name = path.posix.basename(new URL(response.url()).pathname);
		if (!name.endsWith('.woff2')) return;
		fontResponses.push({ font: name.split('-')[0] ?? name, status: response.status() });
	});
	await page.goto(url);
	await page.evaluate(() => document.fonts.ready.then(() => undefined));
	return { fontResponses, page };
}

/** The families Chromium actually used to render an element's text. */
async function renderedFonts(page: Page, selector: string): Promise<Array<string>> {
	const session = await page.context().newCDPSession(page);
	await session.send('DOM.enable');
	await session.send('CSS.enable');
	const { root } = await session.send('DOM.getDocument');
	const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
	const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
	await session.detach();
	return fonts.map((font) => font.familyName);
}

const EM_LENGTH_PATTERN = /^(-?\d*\.?\d+)em$/;

/** Reads each `em` length as a number. A value in another unit reads as `NaN`. */
function emValues(lengths: Record<string, string>): Record<string, number> {
	return Object.fromEntries(
		Object.entries(lengths).map(([name, length]) => [
			name,
			Number(EM_LENGTH_PATTERN.exec(length)?.[1] ?? Number.NaN),
		]),
	);
}

/** The trims `@capsizecss/core` computes for the display fixture: Inter body, Lora display. */
function expectedDisplayFixtureTrims(): Record<string, string> {
	return Object.fromEntries(
		typeStyles.flatMap((style) => {
			const fontSize = typeStyleMetricStep[style];
			const { baselineTrim, capHeightTrim } = precomputeValues({
				fontMetrics: typeStyleFontRole[style] === 'display' ? LORA_METRICS : interMetrics,
				fontSize,
				leading: Number.parseFloat(FONT_METRIC_SCALE[fontSize].lineHeight) * 16,
			});
			return [
				[capsizeTrimVarName(style, 'baselineTrim'), baselineTrim],
				[capsizeTrimVarName(style, 'capHeightTrim'), capHeightTrim],
			];
		}),
	);
}
