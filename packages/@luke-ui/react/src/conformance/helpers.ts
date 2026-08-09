import { expect, test } from 'vite-plus/test';
import type { RenderResult } from '../test-utils/render.js';
import type { ComponentTestRegistration } from './registrations.js';

type RenderComponent = (props?: Record<string, unknown>) => RenderResult;

type UniversalConformanceOptions = {
	name: string;
	registration: ComponentTestRegistration;
	render: RenderComponent;
	getTarget: (result: RenderResult) => HTMLElement;
};

type FieldConformanceOptions = UniversalConformanceOptions & {
	assertName?: (result: RenderResult, control: HTMLElement) => void;
	getControl: (result: RenderResult) => HTMLElement;
	assertAssociation?: (result: RenderResult) => void;
};

function assertNativeName(_: RenderResult, control: HTMLElement) {
	expect(control).toHaveAttribute('name', 'conformance-field');
}

export function testUniversalConformance(options: UniversalConformanceOptions) {
	const { getTarget, name, registration, render } = options;
	if (registration.conformanceTier !== 'universal') {
		throw new Error(`Expected a universal registration for ${registration.path}.`);
	}

	test(`${name} forwards its universal DOM contract`, () => {
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
	const { assertAssociation, assertName, getControl, name, registration, render } = options;
	if (registration.conformanceTier !== 'field-shaped') {
		throw new Error(`Expected a field-shaped registration for ${registration.path}.`);
	}
	test(`${name} forwards its field contract`, async () => {
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
}

export function testIntegration(
	registration: ComponentTestRegistration,
	name: string,
	run: () => void | Promise<void>,
) {
	if (registration.integrationTripwire !== 'required') {
		throw new Error(`Expected an integration registration for ${registration.path}.`);
	}
	test(`${name} integration`, async () => {
		expect.hasAssertions();
		await run();
	});
}
