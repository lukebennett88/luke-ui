import { afterEach, expect, test } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/context';
import { indicator, spinner as spinnerRecipe } from './loading-spinner.css.js';

const mounted: Array<Element> = [];

afterEach(async () => {
	for (const element of mounted) element.remove();
	mounted.length = 0;
	await setEmulatedMedia();
});

test('spinner uses the original rotation and rubber-band timing', () => {
	const { ring, spinner } = mountSpinner();
	const spinnerStyle = getComputedStyle(spinner);
	const ringStyle = getComputedStyle(ring);

	expect(spinnerStyle.animationDuration).toBe('1.2s');
	expect(spinnerStyle.animationTimingFunction).toBe('linear');
	expect(ringStyle.animationDuration).toBe('2s');
	expect(ringStyle.animationTimingFunction).toBe('cubic-bezier(0.42, 0, 0.58, 1)');
});

for (const [name, value] of [
	['forced-colors', 'active'],
	['prefers-reduced-motion', 'reduce'],
] as const) {
	test(`${name} renders the spinner as a static partial ring`, async () => {
		await setEmulatedMedia(name, value);
		const { ring, spinner } = mountSpinner();

		expect(getComputedStyle(spinner).animationName).toBe('none');
		expect(getComputedStyle(ring).animationName).toBe('none');
		expect(getComputedStyle(ring).strokeDasharray).toBe('25px, 100px');
		expect(getComputedStyle(ring).strokeDashoffset).toBe('0px');
	});
}

function mountSpinner() {
	const spinner = document.body.appendChild(document.createElement('div'));
	spinner.className = spinnerRecipe();
	const svg = spinner.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
	const ring = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
	ring.setAttribute('class', indicator());
	mounted.push(spinner);
	return { ring, spinner };
}

async function setEmulatedMedia(name?: string, value?: string) {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: name === undefined || value === undefined ? [] : [{ name, value }],
	});
}
