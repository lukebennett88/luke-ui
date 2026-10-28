import { vars } from '../../../theme/contract.css.js';
import { contextualForeground } from '../../styles/surface.js';

/**
 * Colours and decoration for a text action, such as a text Button. Each colour reads the nearest
 * recognised surface, so it keeps its hue on a standard surface or subtle fill and collapses to the
 * fill's on-solid colour on a solid fill.
 */
export function textActionAppearance(
	tone: 'neutral' | 'danger',
	prominence: 'low' | 'standard' | 'high',
) {
	const role = textActionRole(tone, prominence);
	// Danger and accent keep the role's pressed hue even though it is barely perceptible: the role
	// contract has no stronger rung, and `onSolid` is contrast-solved for solid fills.
	const pressedColor =
		role === 'neutral' ? contextualForeground('primary') : contextualForeground(role, 'pressed');
	const restDecoration = prominence === 'low' ? 'none' : 'underline';
	const hoverDecoration = prominence === 'low' ? 'underline' : 'none';
	return {
		rest: { color: contextualForeground(role), textDecoration: restDecoration },
		hover: { color: contextualForeground(role, 'hover'), textDecoration: hoverDecoration },
		pressed: { color: pressedColor, textDecoration: hoverDecoration },
		focus: { textDecoration: 'underline' },
	} as const;
}

/**
 * Colours, weight, and decoration for a text link. The weight is the theme's label weight. Low
 * prominence adds a solid underline on hover, focus, and press. Standard and high prominence stay
 * underlined in every state. Hover and press thicken the underline, so the state change shows
 * without colour.
 */
export function textLinkAppearance(
	tone: 'neutral' | 'danger',
	prominence: 'low' | 'standard' | 'high',
) {
	const { hover, pressed, rest } = textActionAppearance(tone, prominence);
	const active = {
		textDecorationLine: 'underline',
		textDecorationStyle: 'solid',
		textDecorationThickness: activeUnderlineThickness,
	} as const;
	return {
		rest: {
			color: rest.color,
			fontWeight: vars.font.weight.label,
			textDecorationLine: prominence === 'low' ? 'none' : 'underline',
			textDecorationStyle: 'solid',
			textDecorationThickness: 'auto',
		},
		hover: { color: hover.color, ...active },
		pressed: { color: pressed.color, ...active },
		// The longhand keeps the state's underline style and thickness.
		focus: { textDecorationLine: 'underline' },
	} as const;
}

const activeUnderlineThickness = 'max(2px, 0.125em)';

function textActionRole(tone: 'neutral' | 'danger', prominence: 'low' | 'standard' | 'high') {
	if (tone === 'danger') return 'danger';
	if (prominence === 'high') return 'accent';
	return 'neutral';
}
