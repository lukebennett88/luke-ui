import { vars } from '../../../theme/contract.css.js';
import { contextualForeground } from '../../styles/surface.js';

type Tone = 'neutral' | 'danger';
type Prominence = 'low' | 'standard' | 'high';
type Role = 'neutral' | 'accent' | 'danger';

/**
 * Colours and decoration for a text action, such as a text Button. Each colour reads the nearest
 * recognised surface, so it keeps its hue on a standard surface or subtle fill and collapses to the
 * fill's on-solid colour on a solid fill. A neutral Button is neutral at low and standard
 * prominence and accent at high. Hover and press toggle the underline. Low prominence has none at
 * rest and gains one, and standard and high prominence lose theirs. Low prominence also underlines on
 * keyboard focus.
 */
export function textActionAppearance(tone: Tone, prominence: Prominence) {
	return textActionStates(textActionRole(tone, prominence), prominence);
}

/**
 * Colours, weight, and decoration for a text link. A neutral Link takes the accent foreground at
 * every prominence, and a danger Link keeps danger. The weight is the theme's label weight. Hover
 * and press toggle the underline as for a text Button, so the state change shows without colour.
 */
export function textLinkAppearance(tone: Tone, prominence: Prominence) {
	const states = textActionStates(tone === 'danger' ? 'danger' : 'accent', prominence);
	return {
		rest: { ...states.rest, fontWeight: vars.font.weight.label },
		hover: states.hover,
		pressed: states.pressed,
		focus: states.focus,
	} as const;
}

function textActionStates(role: Role, prominence: Prominence) {
	// Danger and accent keep the role's pressed hue even though it is barely perceptible: the role
	// contract has no stronger rung, and `onSolid` is contrast-solved for solid fills.
	const pressedColor =
		role === 'neutral' ? contextualForeground('primary') : contextualForeground(role, 'pressed');
	// Hover and press toggle the underline, which shows without colour. A low action gains it, and a
	// standard or high action loses it.
	const active = {
		textDecorationLine: prominence === 'low' ? 'underline' : 'none',
		textDecorationStyle: 'solid',
	} as const;
	return {
		rest: {
			color: contextualForeground(role),
			textDecorationLine: prominence === 'low' ? 'none' : 'underline',
			textDecorationStyle: 'solid',
		},
		hover: { color: contextualForeground(role, 'hover'), ...active },
		pressed: { color: pressedColor, ...active },
		// Keyboard focus shows the focus ring. A low action also underlines. Declared last, a focus
		// rule beats hover, so a standard or high action sets none and hover can still remove its line.
		focus: prominence === 'low' ? { textDecorationLine: 'underline' } : {},
	} as const;
}

function textActionRole(tone: Tone, prominence: Prominence): Role {
	if (tone === 'danger') return 'danger';
	if (prominence === 'high') return 'accent';
	return 'neutral';
}
