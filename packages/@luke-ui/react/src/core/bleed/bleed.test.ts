import type { BleedProps } from '@luke-ui/react/bleed';
import { assertType, expectTypeOf, test } from 'vite-plus/test';

test('Bleed accepts spacing tokens and rejects raw lengths', () => {
	expectTypeOf<{ all: 'sp16' }>().toExtend<BleedProps>();
	expectTypeOf<{ all: '0' }>().toExtend<BleedProps>();
	expectTypeOf<{ all: { initial: 'sp8'; bp768: '0' } }>().toExtend<BleedProps>();
	expectTypeOf<{ inline: 'sp16' }>().toExtend<BleedProps>();
	expectTypeOf<{ inline: '0' }>().toExtend<BleedProps>();
	expectTypeOf<{ inline: { initial: 'sp8'; bp768: 'sp24' } }>().toExtend<BleedProps>();
	expectTypeOf<{
		block: 'sp16';
		blockEnd: 'sp8';
		blockStart: 'sp32';
		inline: 'sp16';
		inlineEnd: 'sp8';
		inlineStart: 'sp32';
	}>().toExtend<BleedProps>();

	// @ts-expect-error — a raw CSS length is not a spacing token
	assertType<BleedProps>({ all: '16px' });
	// @ts-expect-error — a raw CSS length is not a spacing token
	assertType<BleedProps>({ inline: '16px' });
	// @ts-expect-error — spacing keys are strings, so a number must not assign
	assertType<BleedProps>({ block: 16 });
	// @ts-expect-error — not a breakpoint
	assertType<BleedProps>({ inline: { initial: 'sp4', tablet: 'sp16' } });
});

test('Bleed rejects margin props and Box appearance utilities', () => {
	// @ts-expect-error — Bleed owns negative margins
	assertType<BleedProps>({ margin: 'sp16' });
	// @ts-expect-error — Bleed owns negative margins
	assertType<BleedProps>({ marginInline: 'sp16' });
	// @ts-expect-error — Bleed owns negative margins
	assertType<BleedProps>({ marginInlineStart: 'sp8' });
	// @ts-expect-error — Bleed owns negative margins
	assertType<BleedProps>({ marginBlock: 'sp16' });
	// @ts-expect-error — Bleed does not expose Box appearance utilities
	assertType<BleedProps>({ backgroundColor: 'surface.base' });
	// @ts-expect-error — Bleed has no display prop
	assertType<BleedProps>({ display: 'grid' });
});

test('Bleed accepts ordinary non-margin layout props', () => {
	expectTypeOf<{ inline: 'sp16'; padding: 'sp8' }>().toExtend<BleedProps>();
	expectTypeOf<{ inlineSize: '100%'; maxInlineSize: '20rem' }>().toExtend<BleedProps>();
	expectTypeOf<{ position: 'relative'; insetInlineStart: '0' }>().toExtend<BleedProps>();
});
