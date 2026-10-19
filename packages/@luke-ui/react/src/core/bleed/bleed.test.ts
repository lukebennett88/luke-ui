import type { BleedProps } from '@luke-ui/react/bleed';
import { assertType, expectTypeOf, test } from 'vite-plus/test';

test('Bleed accepts spacing tokens and rejects raw lengths', () => {
	expectTypeOf<{ all: 'space.16' }>().toExtend<BleedProps>();
	expectTypeOf<{ all: '0' }>().toExtend<BleedProps>();
	expectTypeOf<{ all: { initial: 'space.8'; bp768: '0' } }>().toExtend<BleedProps>();
	expectTypeOf<{ inline: 'space.16' }>().toExtend<BleedProps>();
	expectTypeOf<{ inline: '0' }>().toExtend<BleedProps>();
	expectTypeOf<{ inline: { initial: 'space.8'; bp768: 'space.24' } }>().toExtend<BleedProps>();
	expectTypeOf<{
		block: 'space.16';
		blockEnd: 'space.8';
		blockStart: 'space.32';
		inline: 'space.16';
		inlineEnd: 'space.8';
		inlineStart: 'space.32';
	}>().toExtend<BleedProps>();

	// @ts-expect-error — a raw CSS length is not a spacing token
	assertType<BleedProps>({ all: '16px' });
	// @ts-expect-error — a raw CSS length is not a spacing token
	assertType<BleedProps>({ inline: '16px' });
	// @ts-expect-error — spacing keys are strings, so a number must not assign
	assertType<BleedProps>({ block: 16 });
	// @ts-expect-error — zero is a string token
	assertType<BleedProps>({ all: 0 });
	// @ts-expect-error — zero is outside the spacing namespace
	assertType<BleedProps>({ all: 'space.0' });
	// @ts-expect-error — only curated spacing steps are supported
	assertType<BleedProps>({ all: 'space.20' });
	// @ts-expect-error — spacing tokens use the public namespace
	assertType<BleedProps>({ all: 'sp16' });
	// @ts-expect-error — not a breakpoint
	assertType<BleedProps>({ inline: { initial: 'space.4', tablet: 'space.16' } });
});

test('Bleed rejects margin props and Box appearance utilities', () => {
	// @ts-expect-error — Bleed owns negative margins
	assertType<BleedProps>({ margin: 'space.16' });
	// @ts-expect-error — Bleed owns negative margins
	assertType<BleedProps>({ marginInline: 'space.16' });
	// @ts-expect-error — Bleed owns negative margins
	assertType<BleedProps>({ marginInlineStart: 'space.8' });
	// @ts-expect-error — Bleed owns negative margins
	assertType<BleedProps>({ marginBlock: 'space.16' });
	// @ts-expect-error — Bleed does not expose Box appearance utilities
	assertType<BleedProps>({ backgroundColor: 'surface.base' });
	// @ts-expect-error — Bleed has no display prop
	assertType<BleedProps>({ display: 'grid' });
});

test('Bleed accepts ordinary non-margin layout props', () => {
	expectTypeOf<{ inline: 'space.16'; padding: 'space.8' }>().toExtend<BleedProps>();
	expectTypeOf<{ inlineSize: '100%'; maxInlineSize: '20rem' }>().toExtend<BleedProps>();
	expectTypeOf<{ position: 'relative'; insetInlineStart: '0' }>().toExtend<BleedProps>();
});
