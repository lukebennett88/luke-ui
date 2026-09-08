import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { Icon } from './icon.js';

test('forwards className and id to the svg', () => {
	const { container } = render(
		<Icon className="icon-conformance-class" id="icon-conformance-id" name="add" />,
	);
	const svg = container.querySelector('svg');
	if (!(svg instanceof SVGSVGElement)) throw new Error('Expected an svg.');

	expect(svg).toHaveClass('icon-conformance-class');
	expect(svg).toHaveAttribute('id', 'icon-conformance-id');
});
