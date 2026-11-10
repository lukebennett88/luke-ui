import { readFileSync, writeFileSync } from 'node:fs';
/* eslint-disable no-await-in-loop, no-console -- A command-line script: it reports to the terminal and runs builds and browser steps one at a time. */
// Browser checks for every consumer variant. Serves each prerendered build statically and drives it
// in Chromium with Playwright.
//
//   node verify/run.mjs
//
// Build the consumers first (`node ../build-app.mjs` in each, plus `concentric` for stylex-source).
// Writes `verify/results.json` and `verify/results.md`.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const spikeRoot = fileURLToPath(new URL('..', import.meta.url));
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const variants = ['ve', 've-optimised', 'stylex-precompiled', 'stylex-split', 'stylex-source'];
const types = {
	'.css': 'text/css',
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.svg': 'image/svg+xml',
};

function serve(root) {
	const server = createServer((request, response) => {
		const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname));
		const file = join(root, path.endsWith('/') ? `${path}index.html` : path);
		try {
			const body = readFileSync(file);
			response.writeHead(200, {
				'content-type': types[extname(file)] ?? 'application/octet-stream',
			});
			response.end(body);
		} catch {
			response.writeHead(404).end();
		}
	});
	return new Promise((resolve) => {
		server.listen(0, () =>
			resolve({ close: () => server.close(), url: `http://localhost:${server.address().port}/` }),
		);
	});
}

const properties = [
	'background-color',
	'background-image',
	'block-size',
	'border-block-start-color',
	'border-block-start-width',
	'border-start-start-radius',
	'box-shadow',
	'color',
	'cursor',
	'display',
	'font-family',
	'font-size',
	'font-weight',
	'letter-spacing',
	'line-height',
	'opacity',
	'outline-color',
	'outline-style',
	'outline-width',
	'padding-inline-start',
	'padding-block-start',
	'text-decoration-line',
];

// Elements found the same way in every variant.
const targets = {
	'button high': (page) => page.getByRole('button', { name: 'Save changes' }),
	'button standard': (page) => page.getByRole('button', { name: 'Preview' }),
	'button low': (page) => page.getByRole('button', { name: 'Cancel' }),
	'button low danger': (page) => page.getByRole('button', { name: 'Leave' }),
	'button small danger': (page) => page.getByRole('button', { name: 'Archive' }),
	'button disabled high danger': (page) => page.getByRole('button', { name: 'Delete workspace' }),
	'button text danger': (page) => page.getByRole('button', { name: 'Report a problem' }),
	'button low on solid': (page) => page.getByRole('button', { name: 'Learn more' }),
	'button text on solid': (page) => page.getByRole('button', { name: 'Compare plans' }),
	'text heading1': (page) => page.getByRole('heading', { name: 'Account settings' }),
	'text secondary': (page) => page.getByText('Change how your workspace looks'),
	'text caption clamp': (page) => page.getByText('Deleting the workspace'),
	'text on solid': (page) => page.getByText('Text and low Buttons on a solid surface'),
	'combobox label': (page) => page.getByText('Country', { exact: true }),
	'combobox description': (page) => page.getByText('Used for tax and currency.'),
	'combobox error': (page) => page.getByText('Choose a time zone.'),
	'box page': (page) => page.getByRole('heading', { name: 'Account settings' }).locator('..'),
	'box card': (page) => page.getByRole('heading', { name: 'Profile' }).locator('..'),
	'box solid': (page) => page.getByRole('heading', { name: 'Upgrade' }).locator('..'),
	'combobox control': (page) => page.getByRole('combobox', { name: 'Country' }).locator('..'),
	'combobox input': (page) => page.getByRole('combobox', { name: 'Country' }),
	'combobox invalid control': (page) =>
		page.getByRole('combobox', { name: 'Time zone' }).locator('..'),
	'combobox disabled control': (page) =>
		page.getByRole('combobox', { name: 'Region' }).locator('..'),
	'combobox read-only control': (page) =>
		page.getByRole('combobox', { name: 'Language' }).locator('..'),
};

// Transitions run for up to 250ms. Every read waits for them to settle.
const settle = (page) => page.waitForTimeout(400);

async function computed(locator) {
	await settle(locator.page());
	return locator.evaluate((element, names) => {
		const style = getComputedStyle(element);
		return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]));
	}, properties);
}

async function snapshot(page) {
	const result = {};
	for (const [name, find] of Object.entries(targets))
		result[name] = await computed(find(page).first());
	return result;
}

/** Real pointer and keyboard interactions; React Aria sets the data attributes. */
async function interactions(page) {
	const result = {};
	const save = page.getByRole('button', { name: 'Save changes' });
	const cancel = page.getByRole('button', { name: 'Cancel' });
	await save.hover();
	result['button high hovered'] = await computed(save);
	await page.mouse.down();
	result['button high hovered+pressed'] = await computed(save);
	await page.mouse.up();
	await cancel.hover();
	result['button low hovered'] = await computed(cancel);
	await page.mouse.down();
	result['button low hovered+pressed'] = await computed(cancel);
	await page.mouse.up();
	await page.mouse.move(0, 0);

	const country = page.getByRole('combobox', { name: 'Country' });
	await country.locator('..').hover();
	result['combobox control hovered'] = await computed(country.locator('..'));
	const timeZone = page.getByRole('combobox', { name: 'Time zone' });
	await timeZone.locator('..').hover();
	result['combobox invalid control hovered'] = await computed(timeZone.locator('..'));
	await page.mouse.move(0, 0);

	await country.focus();
	await page.keyboard.press('ArrowDown');
	const listbox = page.getByRole('listbox');
	await listbox.waitFor();
	result['combobox control focused'] = await computed(country.locator('..'));
	result['listbox portalled to body'] = await listbox.evaluate((element) => {
		return !element.closest('[data-rac], form, main') || element.closest('body > *') !== null;
	});
	const active = page.getByRole('option', { name: 'Australia' });
	await page.waitForTimeout(250);
	result['combobox item active'] = await computed(active);
	result['combobox popover'] = await computed(listbox.locator('..'));
	await page.keyboard.press('Enter');
	await page.keyboard.press('Escape');
	result['combobox selected value'] = await country.inputValue();

	// Keyboard focus on a Button draws exactly one ring.
	await page.mouse.click(1, 1);
	await page.keyboard.press('Tab');
	const focused = await page.evaluate(() => {
		const element = document.activeElement;
		const style = getComputedStyle(element);
		return { name: element.textContent, outline: `${style.outlineStyle} ${style.outlineWidth}` };
	});
	result['first tab stop'] = focused;
	return result;
}

function diff(left, right) {
	const out = {};
	for (const [target, values] of Object.entries(left)) {
		if (typeof values !== 'object' || values === null) continue;
		for (const [property, value] of Object.entries(values)) {
			const other = right[target]?.[property];
			if (other !== value) (out[target] ??= {})[property] = { stylex: other, ve: value };
		}
	}
	return out;
}

const browser = await chromium.launch();
const results = {};

for (const variant of variants) {
	const entry = (results[variant] = {});
	const server = await serve(join(spikeRoot, 'consumers', variant, 'dist', 'realistic'));
	try {
		// First paint from server HTML and CSS only.
		const noJs = await browser.newContext({
			javaScriptEnabled: false,
			viewport: { height: 900, width: 1280 },
		});
		const staticPage = await noJs.newPage();
		await staticPage.goto(server.url);
		entry.ssrStyles = await snapshot(staticPage);
		await noJs.close();

		const context = await browser.newContext({ viewport: { height: 900, width: 1280 } });
		const page = await context.newPage();
		const consoleErrors = [];
		page.on('console', (message) => {
			if (message.type() === 'error') consoleErrors.push(message.text());
		});
		page.on('pageerror', (error) => consoleErrors.push(String(error)));
		await page.goto(server.url);
		await page.waitForFunction(() => window.__hydrated === true);
		entry.hydrationErrors = await page.evaluate(() => window.__hydrationErrors);
		entry.consoleErrors = consoleErrors;
		entry.hydratedStyles = await snapshot(page);
		entry.ssrMatchesHydrated =
			JSON.stringify(entry.ssrStyles) === JSON.stringify(entry.hydratedStyles);
		entry.interactions = await interactions(page);

		await page.addScriptTag({ content: axeSource });
		entry.axe = await page.evaluate(async () => {
			const result = await window.axe.run(document, { resultTypes: ['violations'] });
			return result.violations.map((violation) => ({
				id: violation.id,
				nodes: violation.nodes.length,
			}));
		});

		// Theme and colour-mode switching between precompiled themes.
		const save = page.getByRole('button', { name: 'Save changes' });
		const body = page.locator('body');
		const read = async () => ({
			settled: await settle(page),
			body: await body.evaluate((element) => getComputedStyle(element).backgroundColor),
			save: await save.evaluate((element) => getComputedStyle(element).backgroundColor),
		});
		entry.themes = { tactile: await read() };
		await page.getByTestId('theme-luke-ui-theme-paper').click();
		entry.themes.paper = await read();
		await page.getByTestId('mode-dark').click();
		entry.themes.paperDark = await read();
		await page.getByTestId('mode-system').click();
		await page.emulateMedia({ colorScheme: 'dark' });
		entry.themes.paperSystemDark = await read();
		await context.close();

		// Forced colours.
		const forced = await browser.newContext({
			forcedColors: 'active',
			viewport: { height: 900, width: 1280 },
		});
		const forcedPage = await forced.newPage();
		await forcedPage.goto(server.url);
		await forcedPage.waitForFunction(() => window.__hydrated === true);
		entry.forcedColors = await snapshot(forcedPage);
		entry.forcedColorsInteractions = await interactions(forcedPage);
		await forced.close();

		// Reduced motion keeps colour transitions and drops the state-layer transition.
		const reduced = await browser.newContext({ reducedMotion: 'reduce' });
		const reducedPage = await reduced.newPage();
		await reducedPage.goto(server.url);
		entry.reducedMotionTransition = await reducedPage
			.getByRole('button', { name: 'Save changes' })
			.evaluate((element) => getComputedStyle(element).transitionProperty);
		await reduced.close();
	} finally {
		server.close();
	}

	// Tailwind CSS 4 in the same layer order a consumer declares.
	const tailwind = await serve(join(spikeRoot, 'consumers', variant, 'dist', 'tailwind'));
	try {
		const page = await browser.newPage();
		await page.goto(tailwind.url);
		const radius = (id) =>
			page.getByTestId(id).evaluate((element) => getComputedStyle(element).borderStartStartRadius);
		entry.tailwind = {
			boxBackground: await page
				.getByTestId('box-override')
				.evaluate((element) => getComputedStyle(element).backgroundColor),
			boxPadding: await page
				.getByTestId('box-override')
				.evaluate((element) => getComputedStyle(element).paddingInlineStart),
			plainButtonDisplay: await page
				.getByTestId('plain')
				.evaluate((element) => getComputedStyle(element).display),
			plainButtonPadding: await page
				.getByTestId('plain')
				.evaluate((element) => getComputedStyle(element).paddingInlineStart),
			plainRadius: await radius('plain'),
			utilityRadius: await radius('override'),
		};
		await page.close();
	} finally {
		tailwind.close();
	}
}

// Computed-style parity of each variant against the current Vanilla Extract build.
for (const variant of variants.slice(1)) {
	results[variant].parityWithVe = {
		forcedColors: diff(results.ve.forcedColors, results[variant].forcedColors),
		interactions: diff(results.ve.interactions, results[variant].interactions),
		rest: diff(results.ve.hydratedStyles, results[variant].hydratedStyles),
	};
}

// #874 concentric geometry in the StyleX Box.
const concentric = await serve(join(spikeRoot, 'consumers', 'stylex-source', 'dist', 'concentric'));
try {
	const geometry = {};
	for (const width of [600, 1000]) {
		const page = await browser.newPage({ viewport: { height: 1200, width } });
		await page.goto(concentric.url);
		const measure = (id) =>
			page.getByTestId(id).evaluate((element) => {
				const style = getComputedStyle(element);
				return {
					borders: [
						style.borderTopWidth,
						style.borderRightWidth,
						style.borderBottomWidth,
						style.borderLeftWidth,
					],
					padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
					radii: {
						bottomLeft: style.borderBottomLeftRadius,
						bottomRight: style.borderBottomRightRadius,
						topLeft: style.borderTopLeftRadius,
						topRight: style.borderTopRightRadius,
					},
				};
			});
		const cases = {};
		for (const id of [
			'uniform',
			'uniform-child',
			'uniform-grandchild',
			'asymmetric',
			'asymmetric-child',
			'rtl',
			'rtl-child',
			'responsive',
			'responsive-child',
			'clamped',
			'clamped-child',
			'wrapper',
			'wrapper-child',
			'responsive-only',
		]) {
			cases[id] = await measure(id);
		}
		geometry[width] = cases;
		await page.close();
	}
	results.concentric = geometry;
} finally {
	concentric.close();
}

await browser.close();
writeFileSync(
	join(spikeRoot, 'verify', 'results.json'),
	`${JSON.stringify(results, null, '\t')}\n`,
);
console.log('Wrote verify/results.json');
