import type { CodeProps } from '@luke-ui/react/code';
import type { EmProps } from '@luke-ui/react/em';
import type { EmojiProps } from '@luke-ui/react/emoji';
import type { KbdProps } from '@luke-ui/react/kbd';
import type { QuoteProps } from '@luke-ui/react/quote';
import type { StrongProps } from '@luke-ui/react/strong';
import type { TextProps } from '@luke-ui/react/text';
import { createElement } from 'react';
import { assertType, expectTypeOf, test } from 'vite-plus/test';

test('Text accepts named slots and null slot opt-out', () => {
	assertType<TextProps>({ slot: 'description' });
	assertType<TextProps>({ slot: null });
	assertType<TextProps>({ isVisuallyHidden: true, slot: null });
	assertType<TextProps>({ isVisuallyHidden: true, slot: 'label' });
});

test('Text renderRoot receives resolved props and empty state', () => {
	type RenderRoot = NonNullable<TextProps['renderRoot']>;
	expectTypeOf<Parameters<RenderRoot>[1]>().toEqualTypeOf<Record<string, never>>();
	assertType<TextProps>({
		renderRoot: (domProps, _state) => createElement('span', domProps),
	});
	// @ts-expect-error — Text has no public interactive state on renderRoot
	assertType<Parameters<RenderRoot>[1]>({ isHovered: true });
	// @ts-expect-error — public root replacement is renderRoot, not React Aria render
	assertType<TextProps>({ render: (domProps) => createElement('span', domProps) });
});

test('Text renderRoot and elementType are mutually exclusive', () => {
	// @ts-expect-error — elementType and renderRoot are mutually exclusive
	assertType<TextProps>({
		elementType: 'p',
		renderRoot: () => createElement('p'),
	});
	assertType<TextProps>({ id: 'copy', renderRoot: () => createElement('p') });
	assertType<TextProps>({ elementType: 'p', id: 'copy' });
});

test('inline typography takes no slot', () => {
	// @ts-expect-error — inline typography never fills a React Aria text slot
	assertType<CodeProps>({ slot: 'description' });
	// @ts-expect-error — inline typography never fills a React Aria text slot
	assertType<EmProps>({ slot: 'description' });
	// @ts-expect-error — inline typography never fills a React Aria text slot
	assertType<EmojiProps>({ emoji: '🙂', label: 'Smile', slot: 'description' });
	// @ts-expect-error — inline typography never fills a React Aria text slot
	assertType<KbdProps>({ slot: 'description' });
	// @ts-expect-error — inline typography never fills a React Aria text slot
	assertType<QuoteProps>({ slot: 'description' });
	// @ts-expect-error — inline typography never fills a React Aria text slot
	assertType<StrongProps>({ slot: 'description' });
});
