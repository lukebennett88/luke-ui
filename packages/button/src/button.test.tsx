/// <reference types="vitest-axe/extend-expect" />
/// <reference types="vitest-dom/extend-expect" />

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import type { ButtonProps } from './button';
import { Button } from './button';

afterEach(cleanup);

describe('Button', () => {
	it('Should not have ARIA violations after render', async () => {
		vi.useRealTimers();
		const { container } = renderButton();
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

////////////////////////////////////////////////////////////////////////////////

/** Helpers */

const BUTTON_TEXT = 'Hello world';

function TestButton(props?: any) {
	return <Button {...props}>{BUTTON_TEXT}</Button>;
}

function renderButton(props?: Partial<ButtonProps>) {
	return render(<TestButton {...props} />);
}
