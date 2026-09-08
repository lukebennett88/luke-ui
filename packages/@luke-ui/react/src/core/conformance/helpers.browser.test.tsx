import { vi } from 'vite-plus/test';
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
				conformance: ['domProps'],
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
	'data-conformance'?: string;
};

function DomPropsFieldFixture(props: FixtureProps) {
	const { className, id, ...rest } = props;
	return (
		<div className={className} id={id} {...rest}>
			<input />
		</div>
	);
}

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
