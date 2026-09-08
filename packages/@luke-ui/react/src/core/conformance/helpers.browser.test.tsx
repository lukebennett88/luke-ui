import type { FocusEventHandler, Ref } from 'react';
import { expect, test, vi } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import type { ComponentTestManifestEntry } from './manifest.js';

vi.mock('./manifest.js', async (importOriginal) => {
	const actual = (await importOriginal()) as {
		componentTestManifest: ReadonlyArray<ComponentTestManifestEntry>;
	};
	return {
		...actual,
		componentTestManifest: [
			...actual.componentTestManifest,
			{
				conformance: ['domProps', 'field'],
				integrationTripwire: 'none',
				name: 'DomPropsFieldFixture',
				path: 'dom-props-field-fixture',
				visualApplicability: 'none',
			} satisfies ComponentTestManifestEntry,
		],
	};
});

const { testConformance } = await import('./helpers.js');

type FixtureProps = {
	className?: string;
	id?: string;
	inputRef?: Ref<HTMLInputElement>;
	name?: string;
	onBlur?: FocusEventHandler<HTMLInputElement>;
	'data-conformance'?: string;
};

/** Root keeps className, data-*, and id; the nested input is the field control. */
function DomPropsFieldFixture(props: FixtureProps) {
	const { className, id, inputRef, name, onBlur, ...rest } = props;
	return (
		<div className={className} id={id} {...rest}>
			<input name={name} onBlur={onBlur} ref={inputRef} />
		</div>
	);
}

// Regression: domProps must not take its id host from getControl. This fixture
// holds both contracts, puts id on the root, and still supplies getControl.
testConformance({
	path: 'dom-props-field-fixture',
	getControl: (result) => {
		const control = result.container.querySelector('input');
		if (!(control instanceof HTMLElement)) throw new Error('Expected a field control.');
		return control;
	},
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a fixture root.');
		return target;
	},
	render: (props = {}) => render(<DomPropsFieldFixture {...props} />),
});

test('fixture keeps id on the root while getControl resolves the input', () => {
	const { container, unmount } = render(
		<DomPropsFieldFixture
			className="conformance-class"
			data-conformance="true"
			id="conformance-target"
		/>,
	);
	const root = container.firstElementChild;
	const control = container.querySelector('input');
	if (!(root instanceof HTMLElement) || !(control instanceof HTMLElement)) {
		throw new Error('Expected fixture root and control.');
	}

	expect(root).toHaveAttribute('id', 'conformance-target');
	expect(control).not.toHaveAttribute('id', 'conformance-target');
	unmount();
});
