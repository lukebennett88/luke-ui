import { expect, test } from 'vite-plus/test';
import type { RenderResult } from '../test-utils/render.js';
import { componentTestManifest } from './manifest.js';

type RenderComponent = (props?: Record<string, unknown>) => RenderResult;

type ConformanceOptions = {
	assertName?: (result: RenderResult, control: HTMLElement) => void;
	getControl?: (result: RenderResult) => HTMLElement;
	assertAssociation?: (result: RenderResult) => void;
	getTarget?: (result: RenderResult) => HTMLElement;
	path: string;
	render: RenderComponent;
};

function getManifestEntry(path: string) {
	const entry = componentTestManifest.find((candidate) => candidate.path === path);
	if (entry == null) throw new Error(`Unknown component test path: ${path}`);
	return entry;
}

function assertNativeName(_: RenderResult, control: HTMLElement) {
	expect(control).toHaveAttribute('name', 'conformance-field');
}

function requireTarget(options: ConformanceOptions) {
	if (options.getTarget == null) {
		throw new Error(`Expected a getTarget locator for ${options.path}.`);
	}
	return options.getTarget;
}

function requireControl(options: ConformanceOptions) {
	if (options.getControl == null) {
		throw new Error(`Expected a getControl locator for ${options.path}.`);
	}
	return options.getControl;
}

function testDomContract(
	name: string,
	getTarget: (result: RenderResult) => HTMLElement,
	render: RenderComponent,
) {
	test(`${name} forwards its DOM contract`, () => {
		const ref = { current: null as HTMLElement | null };
		const result = render({
			className: 'conformance-class',
			'data-conformance': 'true',
			id: 'conformance-target',
			ref,
		});
		const target = getTarget(result);

		expect(target).toHaveClass('conformance-class');
		expect(target).toHaveAttribute('id', 'conformance-target');
		expect(target).toHaveAttribute('data-conformance', 'true');
		expect(ref.current).toBe(target);
		result.unmount();
	});
}

function testFieldContract(options: ConformanceOptions, name: string) {
	const { assertAssociation, assertName, render } = options;
	const getControl = requireControl(options);

	test(`${name} forwards its field contract`, async () => {
		const inputRef = { current: null as HTMLElement | null };
		let blurred = false;
		const result = render({
			inputRef,
			name: 'conformance-field',
			onBlur: () => {
				blurred = true;
			},
		});
		const control = getControl(result);

		expect(inputRef.current).toBe(control);
		const assertFieldName = assertName ?? assertNativeName;
		assertFieldName(result, control);
		const form = document.createElement('form');
		result.container.replaceWith(form);
		form.append(result.container);
		const namedControl = form.elements.namedItem('conformance-field');
		if (
			!(namedControl instanceof HTMLInputElement) &&
			!(namedControl instanceof HTMLSelectElement) &&
			!(namedControl instanceof HTMLTextAreaElement)
		) {
			throw new Error('Expected a native form control for conformance-field.');
		}
		if (
			namedControl instanceof HTMLInputElement &&
			(namedControl.type === 'checkbox' || namedControl.type === 'radio')
		) {
			namedControl.checked = true;
		}
		namedControl.value = 'conformance-value';
		expect(new FormData(form).get('conformance-field')).toBe('conformance-value');
		control.focus();
		control.blur();
		expect(blurred).toBe(true);
		assertAssociation?.(result);
		result.unmount();
		form.remove();
	});

	// React Aria types `inputRef` as a ref object. Luke UI widens it to accept a
	// callback so React Hook Form's `field.ref` works without an adapter.
	test(`${name} resolves a callback inputRef to the control`, () => {
		const resolved: Array<HTMLElement | null> = [];
		const result = render({
			inputRef: (node: HTMLElement | null) => {
				resolved.push(node);
			},
			name: 'conformance-field',
		});
		const control = getControl(result);

		expect(resolved.at(-1)).toBe(control);
		result.unmount();
	});
}

export function testConformance(options: ConformanceOptions) {
	const { path, render } = options;
	const entry = getManifestEntry(path);

	if (entry.conformance.includes('dom')) {
		testDomContract(entry.name, requireTarget(options), render);
	}
	if (entry.conformance.includes('field')) {
		testFieldContract(options, entry.name);
	}
}

export function testIntegration(path: string, run: () => void | Promise<void>) {
	const entry = getManifestEntry(path);
	if (entry.integrationTripwire !== 'required') {
		throw new Error(`Expected an integration tripwire for ${path}.`);
	}
	test(`${entry.name} integration`, async () => {
		expect.hasAssertions();
		await run();
	});
}
