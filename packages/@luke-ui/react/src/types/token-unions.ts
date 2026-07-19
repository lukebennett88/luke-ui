import type {
	ColorToken,
	FontSizeToken,
	LetterSpacingToken,
	LineHeightToken,
	SizeToken,
} from '../../styled-system/tokens/index.mjs';
import type { FontSizeStep } from '../theme/contract.js';

// The single home for unions derived from the generated design tokens.
// Recipe files import these and declare only their deliberate subsets
// (e.g. `type ButtonTone = Extract<IntentTone, 'accent' | 'danger' | 'neutral'>`),
// so a token renamed or removed from the theme contract fails compilation at
// every dependent recipe.
type IntentToneOf<Token> = Token extends `intent.${infer Tone}.${string}` ? Tone : never;
type IntentSurfaceKeyOf<Token> = Token extends `intent.${string}.surface.${infer Key}`
	? Key
	: never;
type IntentTextToneOf<Token> = Token extends `intent.${infer Tone}.text` ? Tone : never;
type TextLeafOf<Token> = Token extends `text.${infer Leaf}` ? Leaf : never;
type IconSizeOf<Token> = Token extends `iconSize.${infer Size}` ? Size : never;
type ControlSizeOf<Token> = Token extends `controlSize.${infer Size}` ? Size : never;

/** Intent tones present in the colour tokens. */
export type IntentTone = IntentToneOf<ColorToken>;

/** Interaction-surface states every intent tone carries. */
export type SurfaceKey = IntentSurfaceKeyOf<ColorToken>;

/** The exact surface tokens for one intent tone, keyed by surface state. */
export type IntentSurfaces<Tone extends IntentTone> = {
	[Key in SurfaceKey]: Extract<ColorToken, `intent.${Tone}.surface.${Key}`>;
};

/** Semantic text-colour names: intent tones with a `.text` leaf plus the `text.*` leaves. */
export type TextColorName = IntentTextToneOf<ColorToken> | TextLeafOf<ColorToken>;

/** The exact colour token behind a semantic text-colour name. */
export type TextColorTokenFor<Name extends TextColorName> = Extract<
	ColorToken,
	`intent.${Name}.text` | `text.${Name}`
>;

/** Semantic icon-size steps shared by icon-sized components, derived from the size tokens. */
export type IconSize = IconSizeOf<SizeToken>;

/** The exact size token for an icon-size step. */
export type IconSizeToken<Size extends IconSize> = Extract<SizeToken, `iconSize.${Size}`>;

/** Control sizes, derived from the size tokens. */
export type ControlSize = ControlSizeOf<SizeToken>;

/** The exact size token for one control-size step. */
export type ControlSizeToken<Size extends ControlSize> = Extract<SizeToken, `controlSize.${Size}`>;

/** A typography step present in all three generated font scales. */
export type FontStep = FontSizeStep & FontSizeToken & LetterSpacingToken & LineHeightToken;
