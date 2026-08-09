import { expect, test } from 'vite-plus/test';
import type { RenderResult } from '../test-utils/render.js';

export type RenderComponent = (props?: Record<string, unknown>) => RenderResult;

type UniversalConformanceOptions = {
	name: string;
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
	const { getTarget, name, render } = options;

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
	const { assertAssociation, assertName, getControl, name, render } = options;
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
		control.focus();
		control.blur();
		expect(blurred).toBe(true);
		assertAssociation?.(result);
		result.unmount();
	});
}

export function testIntegration(name: string, run: () => void | Promise<void>) {
	test(`${name} integration`, async () => {
		expect.hasAssertions();
		await run();
	});
}
