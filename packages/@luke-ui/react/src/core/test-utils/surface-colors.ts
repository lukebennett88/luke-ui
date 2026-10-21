import { vars } from '@luke-ui/react/theme';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import type { SurfaceBackground } from '../styles/surface.js';
import { contextualForeground } from '../styles/surface.js';

type SemanticRole = (typeof SEMANTIC_ROLES)[number];

/** A Box background value, or any recognised fill with its interaction state. */
export type PairedBackground = SurfaceBackground | `${SemanticRole}.${'subtle' | 'solid'}`;

/** Every contextual foreground slot, in a stable order. */
const FOREGROUND_SLOTS = ['primary', 'secondary', ...SEMANTIC_ROLES] as const;

type ForegroundSlot = (typeof FOREGROUND_SLOTS)[number];

/** The computed colour `value` resolves to inside `parent`, for comparing with computed styles. */
export function resolvedColor(value: string, parent: Element): string {
	const probe = parent.appendChild(document.createElement('span'));
	probe.style.color = value;
	const color = getComputedStyle(probe).color;
	probe.remove();
	return color;
}

/** The fill, text colour, and contextual foreground slots `element` computes. */
export function surfaceColors(element: Element) {
	const computed = getComputedStyle(element);
	return {
		background: computed.backgroundColor,
		color: computed.color,
		foreground: Object.fromEntries(
			FOREGROUND_SLOTS.map((slot) => [slot, resolvedColor(contextualForeground(slot), element)]),
		),
	};
}

/** The theme token each foreground slot reads on `background`. */
function pairedTokens(background: PairedBackground): Record<ForegroundSlot, string> {
	const [group, level] = background.split('.') as [string, string];
	if (level === 'solid') {
		const { onSolid } = vars.color.foreground[group as SemanticRole];
		return {
			primary: onSolid.primary,
			secondary: onSolid.secondary,
			...Object.fromEntries(SEMANTIC_ROLES.map((role) => [role, onSolid.primary])),
		} as Record<ForegroundSlot, string>;
	}
	return {
		primary: vars.color.text.primary,
		secondary: vars.color.text.secondary,
		...Object.fromEntries(SEMANTIC_ROLES.map((role) => [role, vars.color.foreground[role].rest])),
	} as Record<ForegroundSlot, string>;
}

/** The colours `background` pairs with, resolved in `element`'s own colour mode. */
export function pairedColors(element: Element, background: PairedBackground) {
	const [group, level, state = 'rest'] = background.split('.') as [string, string, string?];
	const fill =
		group === 'surface'
			? vars.color.surface[level as keyof typeof vars.color.surface]
			: vars.color.background[group as SemanticRole][level as 'subtle' | 'solid'][
					state as 'rest' | 'hover' | 'pressed'
				];
	const tokens = pairedTokens(background);

	return {
		background: resolvedColor(fill, element),
		color: resolvedColor(tokens.primary, element),
		foreground: Object.fromEntries(
			FOREGROUND_SLOTS.map((slot) => [slot, resolvedColor(tokens[slot], element)]),
		),
	};
}
