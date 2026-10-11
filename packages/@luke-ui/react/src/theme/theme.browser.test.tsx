import { Button } from '@luke-ui/react/button';
import { expect, test } from 'vite-plus/test';
import { render } from '../core/test-utils/render.js';

test('renders components from static CSS without theme context or injected styles', () => {
	const styleCount = document.querySelectorAll('style').length;

	render(<Button>Continue</Button>);

	expect(document.querySelectorAll('style')).toHaveLength(styleCount);
});
