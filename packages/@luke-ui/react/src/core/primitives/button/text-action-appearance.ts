import { vars } from '../../../theme/contract.css.js';

export function textActionAppearance(
	tone: 'neutral' | 'critical',
	prominence: 'low' | 'standard' | 'high',
) {
	const foreground = (() => {
		if (tone === 'critical') return vars.color.foreground.danger;
		if (prominence === 'high') return vars.color.foreground.accent;
		return vars.color.foreground.neutral;
	})();
	// Critical and accent keep `foreground.pressed` even though it is barely perceptible: the role
	// contract has no stronger rung, and `onSolid` is contrast-solved for solid fills.
	const pressedColor =
		tone === 'critical' || prominence === 'high' ? foreground.pressed : vars.color.text.primary;
	const restDecoration = prominence === 'low' ? 'none' : 'underline';
	const hoverDecoration = prominence === 'low' ? 'underline' : 'none';
	return {
		rest: { color: foreground.rest, textDecoration: restDecoration },
		hover: { color: foreground.hover, textDecoration: hoverDecoration },
		pressed: { color: pressedColor, textDecoration: hoverDecoration },
		focus: { textDecoration: 'underline' },
	} as const;
}
