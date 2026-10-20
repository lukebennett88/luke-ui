import type { FieldErrorProps } from '@luke-ui/react/primitives/field';
import { createElement } from 'react';
import { assertType, test } from 'vite-plus/test';

test('FieldError supports structured validation content and uses a fixed block root', () => {
	assertType<FieldErrorProps>({ children: createElement('ul', null, createElement('li')) });
	// @ts-expect-error — FieldError always uses a block container for structured validation content
	assertType<FieldErrorProps>({ elementType: 'div' });
	// @ts-expect-error — FieldError does not expose React Aria's render
	assertType<FieldErrorProps>({ render: () => null });
});
