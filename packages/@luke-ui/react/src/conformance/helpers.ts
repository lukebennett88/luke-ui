import { expect, test } from 'vite-plus/test';
import type { RenderResult } from '../test-utils/render.js';
import { componentTestManifest } from './manifest.js';

type RenderComponent = (props?: Record<string, unknown>) => RenderResult;

type UniversalConformanceOptions = {
	path: string;
	render: RenderComponent;
	getTarget: (result: RenderResult) => HTMLElement;
};

type FieldConformanceOptions = {
	assertName?: (result: RenderResult, control: HTMLElement) => void;
	getControl: (result: RenderResult) => HTMLElement;
	assertAssociation?: (result: RenderResult) => void;
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

export function testUniversalConformance(options: UniversalConformanceOptions) {
	const { getTarget, path, render } = options;
	const entry = getManifestEntry(path);
	if (entry.conformanceTier !== 'universal') {
		throw new Error(`Expected universal conformance for ${path}.`);
	}

	test(`${entry.name} forwards its universal DOM contract`, () => {
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

export function testFieldShapedConformance(options: FieldConformanceOptions) {
	const { assertAssociation, assertName, getControl, path, render } = options;
	const entry = getManifestEntry(path);
	if (entry.conformanceTier !== 'field-shaped') {
		throw new Error(`Expected field-shaped conformance for ${path}.`);
	}
	test(`${entry.name} forwards its field contract`, async () => {
		const inputRef = { current: null as HTMLElement | null };
		let blurred = false;
		const result = render({
			className: 'conformance-class',
			'data-conformance': 'true',
			id: 'conformance-target',
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
	test(`${entry.name} resolves a callback inputRef to the control`, () => {
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
