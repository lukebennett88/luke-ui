import { expect, test } from 'vite-plus/test';
import type { ControlSizeToken, IconSizeToken, TextColorTokenFor } from './token-unions.js';

// @ts-expect-error The generated text token union rejects a deliberate typo.
const invalidAccentText: TextColorTokenFor<'accent'> = 'intent.accent.typo';

// @ts-expect-error The generated icon-size token union rejects a deliberate typo.
const invalidSpinnerSize: IconSizeToken<'medium'> = 'iconSize.meduim';

// @ts-expect-error The generated control-size token union rejects a deliberate typo.
const invalidControlSize: ControlSizeToken<'small'> = 'controlSize.smol';

void invalidAccentText;
void invalidSpinnerSize;
void invalidControlSize;

test('token unions keep recipe token categories exact', () => {
	expect(true).toBe(true);
});
