import * as stylex from '@stylexjs/stylex';
import type { JSX, ReactNode } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { Button as RacButton } from 'react-aria-components/Button';
import { internal, stateLayer } from './internal.stylex.js';
import { composeClassName } from './merge.js';
import { recipe } from './recipe.js';
import { Text } from './text.js';
import { vars } from './tokens.stylex.js';

// StyleX orders rules of equal priority by property and value, not by authoring order, so two states
// that set the same property must never match together. Each selector therefore excludes the states
// it competes with. `:where()` keeps every state at the specificity StyleX gives a condition, so the
// forced-colours rules, which StyleX emits later at the same specificity, win over ordinary states.
const live = '[data-disabled="true"], [data-pending="true"]';
const hovered = `:where([data-hovered="true"], [data-luke-expanded-trigger][aria-expanded="true"]):not(:where([data-pressed="true"], ${live}))`;
const pressed = `:where([data-pressed="true"]):not(:where(${live}))`;
const disabled = ':where([data-disabled="true"])';
const pending = ':where([data-pending="true"])';
const focusVisible = ':where([data-focus-visible="true"]):not(:where([data-disabled="true"]))';
const textHovered =
	':where([data-hovered="true"]):not(:where([data-pressed="true"], [data-disabled="true"]))';
const textPressed = ':where([data-pressed="true"]):not(:where([data-disabled="true"]))';
const forced = '@media (forced-colors: active)';
const reducedMotion = '@media (prefers-reduced-motion: reduce)';

const stateLayerVar = stateLayer['--luke-interaction-state-layer'];
const layerGradient =
	'linear-gradient(var(--luke-interaction-state-layer), var(--luke-interaction-state-layer))';
const tint = (state: 'hover' | 'pressed') => `var(--luke-interaction-tint-${state})`;
const contextual = {
	primary: `var(--luke-internal-foreground-primary, ${vars.color.foreground.primary})`,
	role: (role: string, state: string) =>
		`var(--luke-internal-foreground-tone, var(--luke-color-foreground-${role}-${state}))`,
};
const transitionAll = `background-color, border-color, box-shadow, color, opacity, text-decoration-color, --luke-interaction-state-layer`;

// `surfaceStyle()` for a role solid in each interaction state, written property-first because StyleX
// keys conditions under each property.
const solidStates = (role: 'accent' | 'danger') => ({
	backgroundColor: {
		default: `var(--luke-color-background-${role}-solid-rest)`,
		[hovered]: `var(--luke-color-background-${role}-solid-hover)`,
		[pressed]: `var(--luke-color-background-${role}-solid-pressed)`,
	},
	backgroundImage: {
		default: vars.controlFinish.resting,
		[hovered]: vars.controlFinish.raised,
		[pressed]: vars.controlFinish.recessed,
		[forced]: 'none',
	},
	color: `var(--luke-color-foreground-${role}-on-solid)`,
	[internal['--luke-internal-foreground-primary']]: `var(--luke-color-foreground-${role}-on-solid)`,
	[internal['--luke-internal-foreground-secondary']]:
		`var(--luke-color-foreground-${role}-on-solid)`,
	[internal['--luke-internal-foreground-tone']]: `var(--luke-color-foreground-${role}-on-solid)`,
	[internal['--luke-internal-focus']]: `var(--luke-color-foreground-${role}-on-solid)`,
	[internal['--luke-internal-surface-fill-rest']]: {
		default: `var(--luke-color-background-${role}-solid-rest)`,
		[hovered]: `var(--luke-color-background-${role}-solid-hover)`,
		[pressed]: `var(--luke-color-background-${role}-solid-pressed)`,
	},
	[internal['--luke-internal-surface-fill-hover']]:
		`var(--luke-color-background-${role}-solid-hover)`,
	[internal['--luke-internal-surface-fill-pressed']]:
		`var(--luke-color-background-${role}-solid-pressed)`,
	[internal['--luke-internal-surface-finish-hover']]: vars.controlFinish.raised,
	[internal['--luke-internal-surface-finish-pressed']]:
		`${vars.controlFinish.recessed}, ${vars.controlFinish.recessed}`,
	[internal['--luke-internal-surface-shadow-pressed']]:
		`${vars.shadow.inset}, ${vars.shadow.inset}, ${vars.shadow.inset}`,
});

// A standard Button: the neutral subtle surface with the adaptive state layer above it.
const subtleStates = (color: string) => ({
	backgroundColor: vars.color.background.neutral.subtle,
	backgroundImage: {
		default: `${vars.controlFinish.resting}, ${layerGradient}`,
		[hovered]: `${vars.controlFinish.raised}, ${layerGradient}`,
		[pressed]: `${vars.controlFinish.recessed}, ${layerGradient}`,
		[forced]: 'none',
	},
	color,
	[stateLayerVar]: { default: 'transparent', [hovered]: tint('hover'), [pressed]: tint('pressed') },
	[internal['--luke-internal-foreground-primary']]: 'initial',
	[internal['--luke-internal-foreground-secondary']]: 'initial',
	[internal['--luke-internal-foreground-tone']]: 'initial',
	[internal['--luke-internal-focus']]: 'initial',
	[internal['--luke-internal-surface-fill-rest']]: vars.color.background.neutral.subtle,
	[internal['--luke-internal-surface-fill-hover']]: tint('hover'),
	[internal['--luke-internal-surface-fill-pressed']]: tint('pressed'),
	[internal['--luke-internal-surface-finish-hover']]: 'initial',
	[internal['--luke-internal-surface-finish-pressed']]: 'initial',
	[internal['--luke-internal-surface-shadow-pressed']]: 'initial',
});

// A low Button paints the nearest managed surface's fill, with that surface's state fills above it.
const transparentStates = (color: string) => ({
	backgroundColor: 'var(--luke-internal-surface-fill-rest, transparent)',
	backgroundImage: {
		default: layerGradient,
		[hovered]: `var(--luke-internal-surface-finish-hover, none), ${layerGradient}`,
		[pressed]: `var(--luke-internal-surface-finish-pressed, none), ${layerGradient}`,
		[forced]: 'none',
	},
	// A compound replaces the appearance's whole `boxShadow` entry, so it restates every condition.
	boxShadow: {
		default: 'none',
		[hovered]: vars.shadow.raised,
		[pressed]: `var(--luke-internal-surface-shadow-pressed, ${vars.shadow.inset})`,
		[forced]: 'none',
	},
	color,
	[stateLayerVar]: {
		default: 'transparent',
		[hovered]: `var(--luke-internal-surface-fill-hover, ${tint('hover')})`,
		[pressed]: `var(--luke-internal-surface-fill-pressed, ${tint('pressed')})`,
	},
});

const textStates = (
	role: 'accent' | 'danger' | 'neutral',
	prominence: 'low' | 'standard' | 'high',
) => ({
	color: {
		default: contextual.role(role, 'rest'),
		[textHovered]: contextual.role(role, 'hover'),
		[textPressed]: role === 'neutral' ? contextual.primary : contextual.role(role, 'pressed'),
		[forced]: { default: 'LinkText', [disabled]: 'GrayText' },
	},
	textDecorationLine: {
		default: prominence === 'low' ? 'none' : 'underline',
		[textHovered]: prominence === 'low' ? 'underline' : 'none',
		[textPressed]: prominence === 'low' ? 'underline' : 'none',
		[focusVisible]: prominence === 'low' ? 'underline' : null,
	},
});

const styles = stylex.create({
	base: {
		font: 'inherit',
		touchAction: 'manipulation',
		WebkitTapHighlightColor: 'transparent',
		transitionDuration: vars.motion.feedback.duration,
		transitionProperty: {
			default: transitionAll,
			[reducedMotion]: transitionAll.replace(', --luke-interaction-state-layer', ''),
		},
		transitionTimingFunction: vars.motion.feedback.easing,
		cursor: { default: null, [disabled]: 'not-allowed', [pending]: 'wait' },
		opacity: {
			default: null,
			[disabled]: vars.interaction.disabledOpacity,
			[forced]: { [disabled]: 1, [pending]: 1 },
		},
	},
	button: {
		alignItems: 'center',
		appearance: 'none',
		borderColor: {
			default: 'transparent',
			[forced]: { default: 'ButtonText', [disabled]: 'GrayText' },
		},
		borderRadius: vars.radius.control,
		borderStyle: 'solid',
		borderWidth: { default: 0, [forced]: '1px' },
		boxShadow: {
			default: vars.shadow.resting,
			[hovered]: vars.shadow.raised,
			[pressed]: vars.shadow.inset,
			[forced]: 'none',
		},
		color: { [forced]: { default: 'ButtonText', [disabled]: 'GrayText' } },
		display: 'inline-flex',
		fontFamily: vars.font.family.body,
		fontWeight: vars.font.weight.label,
		forcedColorAdjust: { [forced]: 'auto' },
		isolation: 'isolate',
		justifyContent: 'center',
		letterSpacing: '0',
		lineHeight: '1.25rem',
		minBlockSize: 'max(1.5rem, 24px)',
		minInlineSize: 'max(1.5rem, 24px)',
		paddingBlock: 0,
		position: 'relative',
		textDecoration: 'none',
		whiteSpace: 'nowrap',
	},
	text: {
		appearance: 'none',
		backgroundColor: 'transparent',
		backgroundImage: 'none',
		borderStyle: 'none',
		borderRadius: 0,
		boxShadow: 'none',
		display: 'inline',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		forcedColorAdjust: { [forced]: 'auto' },
		letterSpacing: 'inherit',
		lineHeight: 'inherit',
		minBlockSize: 0,
		minInlineSize: 'auto',
		padding: 0,
		position: 'relative',
		textAlign: 'start',
		textDecorationColor: 'currentColor',
		verticalAlign: 'baseline',
	},
	inlineFull: { inlineSize: '100%' },
	medium: {
		blockSize: vars.controlSize['40'],
		fontSize: '0.875rem',
		gap: vars.space['8'],
		paddingInline: { default: `calc(${vars.space['16']} + 1px)`, [forced]: vars.space['16'] },
	},
	small: {
		blockSize: vars.controlSize['32'],
		fontSize: '0.75rem',
		gap: vars.space['4'],
		letterSpacing: '0.0025em',
		lineHeight: '1rem',
		paddingInline: { default: `calc(${vars.space['12']} + 1px)`, [forced]: vars.space['12'] },
	},
	neutralLow: transparentStates(contextual.primary),
	dangerLow: transparentStates(contextual.role('danger', 'rest')),
	neutralStandard: subtleStates(vars.color.foreground.primary),
	dangerStandard: subtleStates(vars.color.foreground.danger.rest),
	neutralHigh: solidStates('accent'),
	dangerHigh: solidStates('danger'),
	textNeutralLow: textStates('neutral', 'low'),
	textNeutralStandard: textStates('neutral', 'standard'),
	textNeutralHigh: textStates('accent', 'high'),
	textDangerLow: textStates('danger', 'low'),
	textDangerStandard: textStates('danger', 'standard'),
	content: { alignItems: 'center', display: 'inline-flex', minInlineSize: 0, position: 'relative' },
	label: { alignItems: 'center', display: 'inline-flex', gap: vars.space['8'], minInlineSize: 0 },
});

/** Button presentation recipe. Compounds pick the complete treatment for each combination. */
export const buttonRecipe = recipe({
	base: styles.base,
	defaultVariants: {
		appearance: 'button',
		inlineSize: 'auto',
		prominence: 'standard',
		size: 'medium',
		tone: 'neutral',
	},
	variants: {
		appearance: { button: styles.button, text: styles.text },
		inlineSize: { auto: null, full: styles.inlineFull },
		prominence: { high: null, low: null, standard: null },
		size: { medium: null, small: null },
		tone: { danger: null, neutral: null },
	},
	compoundVariants: [
		{ style: styles.medium, variants: { appearance: 'button', size: 'medium' } },
		{ style: styles.small, variants: { appearance: 'button', size: 'small' } },
		{
			style: styles.neutralLow,
			variants: { appearance: 'button', prominence: 'low', tone: 'neutral' },
		},
		{
			style: styles.neutralStandard,
			variants: { appearance: 'button', prominence: 'standard', tone: 'neutral' },
		},
		{
			style: styles.neutralHigh,
			variants: { appearance: 'button', prominence: 'high', tone: 'neutral' },
		},
		{
			style: styles.dangerLow,
			variants: { appearance: 'button', prominence: 'low', tone: 'danger' },
		},
		{
			style: styles.dangerStandard,
			variants: { appearance: 'button', prominence: 'standard', tone: 'danger' },
		},
		{
			style: styles.dangerHigh,
			variants: { appearance: 'button', prominence: 'high', tone: 'danger' },
		},
		{
			style: styles.textNeutralLow,
			variants: { appearance: 'text', prominence: 'low', tone: 'neutral' },
		},
		{
			style: styles.textNeutralStandard,
			variants: { appearance: 'text', prominence: 'standard', tone: 'neutral' },
		},
		{
			style: styles.textNeutralHigh,
			variants: { appearance: 'text', prominence: 'high', tone: 'neutral' },
		},
		{
			style: styles.textDangerLow,
			variants: { appearance: 'text', prominence: 'low', tone: 'danger' },
		},
		{
			style: styles.textDangerStandard,
			variants: { appearance: 'text', prominence: 'standard', tone: 'danger' },
		},
	],
});

/** Props for `Button`. A subset of the Vanilla Extract Button's props. */
export interface ButtonProps extends Omit<RacButtonProps, 'children'> {
	appearance?: 'button' | 'text';
	children?: ReactNode;
	endContent?: ReactNode;
	inlineSize?: 'auto' | 'full';
	prominence?: 'low' | 'standard' | 'high';
	size?: 'small' | 'medium';
	startContent?: ReactNode;
	tone?: 'neutral' | 'danger';
}

/** Button. React Aria owns every interaction state and StyleX styles its data attributes. */
export function Button(props: ButtonProps): JSX.Element {
	const {
		appearance = 'button',
		children,
		className,
		endContent,
		inlineSize,
		prominence,
		size,
		startContent,
		style,
		tone,
		...rest
	} = props;
	const resolved = stylex.props(buttonRecipe({ appearance, inlineSize, prominence, size, tone }));
	const content =
		appearance === 'text' ? (
			<Text elementType="span" shouldInheritFont textDecoration="inherit">
				{children}
			</Text>
		) : (
			<span {...stylex.props(styles.content)}>
				<span {...stylex.props(styles.label)}>
					{startContent}
					<Text elementType="span" lineClamp shouldInheritFont>
						{children}
					</Text>
					{endContent}
				</span>
			</span>
		);
	return (
		<RacButton
			{...rest}
			className={composeClassName(resolved.className, className)}
			style={style ?? resolved.style}
		>
			{content}
		</RacButton>
	);
}
