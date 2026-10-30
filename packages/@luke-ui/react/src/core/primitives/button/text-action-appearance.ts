import { vars } from '../../../theme/contract.css.js';
import { contextualForeground } from '../../styles/surface.js';

type Tone = 'neutral' | 'danger';
type Prominence = 'low' | 'standard' | 'high';
type Role = 'neutral' | 'accent' | 'danger';

/**
 * Colours and decoration for a text action, such as a text Button. Each colour reads the nearest
 * recognised surface, so it keeps its hue on a standard surface or subtle fill and collapses to the
 * fill's on-solid colour on a solid fill. A neutral Button is neutral at low and standard
 * prominence and accent at high. Low prominence has no resting underline and gains one on hover,
 * focus, and press. Standard and high prominence stay underlined and thicken it on hover and press.
 */
export function textActionAppearance(tone: Tone, prominence: Prominence) {
	return textActionStates(textActionRole(tone, prominence), prominence);
}

/**
 * Colours, weight, and decoration for a text link. A neutral Link takes the accent foreground at
 * every prominence, and a danger Link keeps danger. The weight is the theme's label weight. Low
 * prominence adds a solid underline on hover, focus, and press. Standard and high prominence stay
 * underlined in every state. Hover and press thicken the underline, so the state change shows
 * without colour.
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
	const active = {
		textDecorationLine: 'underline',
		textDecorationStyle: 'solid',
		textDecorationThickness: activeUnderlineThickness,
	} as const;
	return {
		rest: {
			color: contextualForeground(role),
			textDecorationLine: prominence === 'low' ? 'none' : 'underline',
			textDecorationStyle: 'solid',
			textDecorationThickness: 'auto',
		},
		hover: { color: contextualForeground(role, 'hover'), ...active },
		pressed: { color: pressedColor, ...active },
		// The longhand keeps the state's underline style and thickness.
		focus: { textDecorationLine: 'underline' },
	} as const;
}

const activeUnderlineThickness = 'max(2px, 0.125em)';

function textActionRole(tone: Tone, prominence: Prominence): Role {
	if (tone === 'danger') return 'danger';
	if (prominence === 'high') return 'accent';
	return 'neutral';
}
