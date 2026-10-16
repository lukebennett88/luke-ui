import type { BlockquoteProps } from '@luke-ui/react/blockquote';
import type { CodeProps } from '@luke-ui/react/code';
import type { EmProps } from '@luke-ui/react/em';
import type { EmojiProps } from '@luke-ui/react/emoji';
import type { HeadingProps } from '@luke-ui/react/heading';
import type { KbdProps } from '@luke-ui/react/kbd';
import type { NumeralProps } from '@luke-ui/react/numeral';
import type { QuoteProps } from '@luke-ui/react/quote';
import type { StrongProps } from '@luke-ui/react/strong';
import type { TextProps } from '@luke-ui/react/text';
import { assertType, test } from 'vite-plus/test';

test('Text accepts named slots and null slot opt-out', () => {
	assertType<TextProps>({ slot: 'description' });
	assertType<TextProps>({ slot: null });
	assertType<TextProps>({ isVisuallyHidden: true, slot: null });
	assertType<TextProps>({ isVisuallyHidden: true, slot: 'label' });
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

test('Text and Heading take adornments, Numeral and Blockquote do not', () => {
	assertType<TextProps>({ endContent: 'End', startContent: 'Start' });
	assertType<HeadingProps>({ endContent: 'End', startContent: 'Start' });
	assertType<TextProps>({ gap: 'sp12', startContent: 'Start' });
	assertType<HeadingProps>({ gap: { initial: '0', bp640: 'sp12' }, startContent: 'Start' });
	// @ts-expect-error — responsive spacing needs an initial value
	assertType<TextProps>({ gap: { bp640: 'sp12' } });
	// @ts-expect-error — gap accepts spacing tokens, not arbitrary CSS lengths
	assertType<TextProps>({ gap: '12px' });
	// @ts-expect-error — a formatted number has no adornment spacing
	assertType<NumeralProps>({ gap: 'sp12', value: 1 });
	// @ts-expect-error — a quotation has no adornment spacing
	assertType<BlockquoteProps>({ gap: 'sp12' });
	// @ts-expect-error — a formatted number has no adornments
	assertType<NumeralProps>({ startContent: 'Start', value: 1 });
	// @ts-expect-error — a formatted number has no adornments
	assertType<NumeralProps>({ endContent: 'End', value: 1 });
	// @ts-expect-error — a quotation has no adornments
	assertType<BlockquoteProps>({ startContent: 'Start' });
	// @ts-expect-error — a quotation has no adornments
	assertType<BlockquoteProps>({ endContent: 'End' });
});
