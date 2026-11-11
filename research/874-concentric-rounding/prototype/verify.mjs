/* oxlint-disable no-await-in-loop, no-console, unicorn/consistent-function-scoping -- a sequential command-line script that reports to the terminal, and `measure` is serialised into the page */
// Serves the built prototype and checks it in real browsers.
//
//   node verify.mjs                 # Chromium
//   node verify.mjs firefox webkit  # other engines, once `playwright install` has fetched them
//
// Writes `results/<engine>.json`, `results/cases-1100.md`, `results/summary.md`, and screenshots.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import playwright from 'playwright';

const root = fileURLToPath(new URL('.', import.meta.url));
const dist = join(root, 'dist');
const out = join(root, 'results');
mkdirSync(out, { recursive: true });

const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };
const server = createServer((request, response) => {
	const path = new URL(request.url, 'http://x').pathname;
	try {
		const body = readFileSync(join(dist, path === '/' ? 'concentric.html' : path));
		response.writeHead(200, { 'content-type': types[extname(path)] ?? 'text/html' }).end(body);
	} catch {
		response.writeHead(404).end();
	}
});
await new Promise((resolve) => server.listen(0, resolve));
const origin = `http://localhost:${server.address().port}`;

/** Runs in the page. Measures every Box and checks each marked child against its surface. */
function measure() {
	const px = (value) => Number.parseFloat(value);
	const corner = (style, name) => {
		const [h, v = h] = style[name].split(' ').map(px);
		return { h, v };
	};
	const radii = (element) => {
		const style = getComputedStyle(element);
		return {
			bl: corner(style, 'borderBottomLeftRadius'),
			br: corner(style, 'borderBottomRightRadius'),
			tl: corner(style, 'borderTopLeftRadius'),
			tr: corner(style, 'borderTopRightRadius'),
		};
	};
	const sideOf = {
		bl: ['left', 'bottom'],
		br: ['right', 'bottom'],
		tl: ['left', 'top'],
		tr: ['right', 'top'],
	};
	const checks = [];
	for (const child of document.querySelectorAll('[data-check], [data-expect-radius]')) {
		const id = child.closest('[data-case]').dataset.case;
		const level = child.dataset.level ? `#${child.dataset.level}` : '';
		const actual = radii(child);
		if (child.dataset.expectRadius !== undefined) {
			const expected = Number(child.dataset.expectRadius);
			const pass = Object.values(actual).every(({ h, v }) => h === expected && v === expected);
			checks.push({ actual, expected, id: id + level, kind: 'documented', pass });
			continue;
		}
		const parent = child.parentElement.closest('[data-parent]');
		const outer = radii(parent);
		const a = parent.getBoundingClientRect();
		const b = child.getBoundingClientRect();
		// The inset is measured from layout, not read from the variables under test.
		const inset = {
			bottom: a.bottom - b.bottom,
			left: b.left - a.left,
			right: a.right - b.right,
			top: b.top - a.top,
		};
		const expected = {};
		let pass = true;
		for (const [name, [horizontal, vertical]] of Object.entries(sideOf)) {
			expected[name] = {
				h: Math.max(0, outer[name].h - inset[horizontal]),
				v: Math.max(0, outer[name].v - inset[vertical]),
			};
			// A corner with either radius at zero is square, so the other axis does not matter.
			const square = expected[name].h === 0 || expected[name].v === 0;
			const drawnSquare = actual[name].h === 0 || actual[name].v === 0;
			const same =
				Math.abs(expected[name].h - actual[name].h) < 0.01 &&
				Math.abs(expected[name].v - actual[name].v) < 0.01;
			if (!(same || (square && drawnSquare))) pass = false;
		}
		checks.push({ actual, expected, id: id + level, inset, kind: 'geometry', outer, pass });
	}
	const layout = [...document.querySelectorAll('#root div')].map((element) => {
		const rect = element.getBoundingClientRect();
		const style = getComputedStyle(element);
		return [rect.x, rect.y, rect.width, rect.height, style.padding, style.borderWidth].join(',');
	});
	const styled = [...document.querySelectorAll('#root [class]')];
	return {
		checks,
		inlineProperties: styled.map((element) => element.style.length),
		layout,
	};
}

const brief = ({ h, v }) => (h === v ? `${h}` : `${h}/${v}`);
const corners = (value) =>
	`${brief(value.tl)} ${brief(value.tr)} ${brief(value.br)} ${brief(value.bl)}`;

const widths = [600, 800, 1100];
const themes = ['', 'theme-round', 'theme-square'];
// Past the supported depth the last rule keeps applying, so levels 5 and 6 read a stale set.
const knownFailures = new Set(['deep#5', 'deep#6', 'separated-deep#5']);

const summary = [];
let failed = false;
for (const engine of process.argv.slice(2).length ? process.argv.slice(2) : ['chromium']) {
	const browser = await playwright[engine].launch();
	const result = { engine, runs: [], version: browser.version() };
	const open = async (path, width) => {
		const page = await browser.newPage({ viewport: { height: 1400, width } });
		const errors = [];
		page.on('pageerror', (error) => errors.push(String(error)));
		page.on('console', (message) => {
			if (message.type() === 'error') errors.push(message.text());
		});
		await page.goto(origin + path);
		await page.waitForFunction(() => window.report?.ready);
		return { errors, page };
	};

	for (const width of widths) {
		const { errors, page } = await open('/concentric.html', width);
		for (const theme of themes) {
			await page.evaluate((name) => {
				document.documentElement.className = name;
			}, theme);
			const measured = await page.evaluate(measure);
			// Documented fallbacks are stated in px for the default theme only.
			const checks = measured.checks.filter((check) => theme === '' || check.kind === 'geometry');
			measured.checks = checks;
			const unexpected = checks.filter((check) => {
				// Known limits are recorded, not asserted: a square theme makes them pass by accident.
				return !check.pass && !knownFailures.has(check.id);
			});
			result.runs.push({
				checks: checks.length,
				errors,
				failed: checks.filter((check) => !check.pass).map((check) => check.id),
				theme: theme || 'default',
				width,
			});
			if (theme === '' && width === 1100) result.cases = checks;
			const queryFailures = unexpected.filter((check) => check.id.startsWith('query'));
			const real = unexpected.filter((check) => !check.id.startsWith('query'));
			if (real.length > 0 || errors.length > 0) failed = true;
			summary.push(
				`| ${engine} ${result.version} | ${width} | ${theme || 'default'} | ${measured.checks.length} | ${
					real.length === 0 ? 'pass' : `FAIL: ${real.map((check) => check.id).join(', ')}`
				} | ${queryFailures.length === 0 ? 'pass' : `fails (${queryFailures.length})`} |`,
			);
			if (theme === '') {
				await page.screenshot({ fullPage: true, path: join(out, `${engine}-${width}.png`) });
				result.inlineProperties = measured.inlineProperties.reduce((sum, count) => sum + count, 0);
			}
			if (theme === 'theme-round' && width === 1100) {
				await page.screenshot({ fullPage: true, path: join(out, `${engine}-1100-round.png`) });
			}
		}
		if (width === 1100) {
			// Zoomed evidence for the hardest geometry.
			for (const id of ['uniform', 'sides', 'sides-rtl', 'border-sides']) {
				await page.evaluate(() => {
					document.documentElement.className = 'theme-round';
					document.body.style.zoom = '4';
				});
				await page
					.locator(`[data-case="${id}"]`)
					.screenshot({ path: join(out, `${engine}-${id}-4x.png`) });
			}
		}
		await page.close();

		// Ordinary Box layout must be identical with and without the feature.
		const baseline = await open('/baseline.html', width);
		const concentric = await open('/concentric.html', width);
		const [before, after] = await Promise.all([
			baseline.page.evaluate(measure),
			concentric.page.evaluate(measure),
		]);
		const moved = before.layout.filter((entry, index) => entry !== after.layout[index]).length;
		result.runs.push({ layoutDifferences: moved, layoutElements: before.layout.length, width });
		if (moved > 0 || before.layout.length !== after.layout.length) failed = true;
		result.baselineInlineProperties = before.inlineProperties.reduce(
			(sum, count) => sum + count,
			0,
		);
		await baseline.page.close();
		await concentric.page.close();
	}

	// Server render, then hydrate the same markup.
	const ssr = await open('/concentric.html?ssr', 1100);
	const hydration = await ssr.page.evaluate(() => {
		return {
			errors: window.report.hydrationErrors,
			sameMarkup: (() => {
				// Compare through the parser, so attribute serialisation differences do not count.
				const parsed = document.createElement('div');
				parsed.innerHTML = window.report.serverHtml;
				return parsed.innerHTML === document.querySelector('#root').innerHTML;
			})(),
			serverBytes: window.report.serverHtml.length,
		};
	});
	const afterHydration = await ssr.page.evaluate(measure);
	result.ssr = {
		...hydration,
		consoleErrors: ssr.errors,
		failures: afterHydration.checks.filter(
			(check) => !check.pass && !knownFailures.has(check.id) && !check.id.startsWith('query'),
		).length,
	};
	if (result.ssr.failures > 0 || ssr.errors.length > 0 || !hydration.sameMarkup) failed = true;
	await ssr.page.close();

	writeFileSync(join(out, `${engine}.json`), `${JSON.stringify(result, null, '\t')}\n`);
	await browser.close();

	if (engine === 'chromium') {
		const table = result.cases.map((check) => {
			return `| ${check.id} | ${check.kind} | ${check.outer ? corners(check.outer) : ''} | ${
				check.inset
					? `${check.inset.top} ${check.inset.right} ${check.inset.bottom} ${check.inset.left}`
					: ''
			} | ${check.expected.tl ? corners(check.expected) : check.expected} | ${corners(check.actual)} | ${check.pass ? 'pass' : 'FAIL'} |`;
		});
		writeFileSync(
			join(out, 'cases-1100.md'),
			[
				'| Case | Check | Parent corners | Inset t r b l | Expected | Actual | Result |',
				'| --- | --- | --- | --- | --- | --- | --- |',
				...table,
				'',
			].join('\n'),
		);
	}
	summary.push(
		`| ${engine} ssr | 1100 | default | | ${result.ssr.failures === 0 && result.ssr.sameMarkup && result.ssr.errors.length === 0 ? 'pass' : 'FAIL'} | |`,
	);
	console.log(engine, JSON.stringify(result.ssr));
}

const table = [
	'| Engine | Width | Theme | Checks | Selector alternation | Style-query alternative |',
	'| --- | --- | --- | --- | --- | --- |',
	...summary,
].join('\n');
writeFileSync(join(out, 'summary.md'), `${table}\n`);
console.log(table);
server.close();
process.exit(failed ? 1 : 0);
