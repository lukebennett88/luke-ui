import * as stylex from '@stylexjs/stylex';
import type { JSX, ReactNode } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import type { ComboBoxProps as RacComboBoxProps } from 'react-aria-components/ComboBox';
import { ComboBox as RacComboBox } from 'react-aria-components/ComboBox';
import { FieldError } from 'react-aria-components/FieldError';
import { Group } from 'react-aria-components/Group';
import { Header } from 'react-aria-components/Header';
import { Input } from 'react-aria-components/Input';
import { Label } from 'react-aria-components/Label';
import type { ListBoxItemProps } from 'react-aria-components/ListBox';
import { ListBox, ListBoxItem, ListBoxSection } from 'react-aria-components/ListBox';
import { Popover } from 'react-aria-components/Popover';
import { Text as RacText } from 'react-aria-components/Text';
import { composeClassName } from './merge.js';
import { vars } from './tokens.stylex.js';

// The field-state matrix that `composeInputStateSelectors()` shares between recipes in the Vanilla
// Extract build. StyleX cannot import selector strings from another module, and `defineConsts`
// selectors emit malformed CSS, so this file owns its own copy. Hover excludes invalid, because
// StyleX would otherwise order the two border colours by value rather than by authoring order.
const disabledState =
	'[data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])';
const invalidState =
	'[data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])';
const readOnlyState = '[data-readonly="true"], :has(input:read-only)';
const fieldDisabled = `:where(${disabledState})`;
const fieldHover = `:where([data-hovered="true"], :hover):not(:where(${disabledState}, ${readOnlyState}, ${invalidState}))`;
const fieldFocus = `:where([data-focus-within="true"], :focus-within):where(:has(input:focus)):not(:where(${disabledState}))`;
const fieldInvalid = `:where(${invalidState}):not(:where(${disabledState}))`;
const fieldReadOnly = `:where(${readOnlyState}):not(:where(${disabledState}))`;

const actionHovered =
	':where([data-hovered="true"]):not(:where([data-pressed="true"], [data-disabled="true"]))';
const actionPressed = ':where([data-pressed="true"]):not(:where([data-disabled="true"]))';
const actionDisabled = ':where([data-disabled="true"])';

const itemFocused =
	':where([data-focused="true"]):not(:where([data-pressed="true"], [data-disabled="true"]))';
const itemPressed =
	':where([data-focused="true"][data-pressed="true"]):not(:where([data-disabled="true"]))';
const itemDisabled = ':where([data-disabled="true"])';

const entering = ':where([data-entering])';
const exiting = ':where([data-exiting])';
const placedTop = ':where([data-placement="top"])';

const forced = '@media (forced-colors: active)';
const reducedMotion = '@media (prefers-reduced-motion: reduce)';
const coarse = '@media (pointer: coarse)';

const primary = `var(--luke-internal-foreground-primary, ${vars.color.foreground.primary})`;
const secondary = `var(--luke-internal-foreground-secondary, ${vars.color.foreground.secondary})`;
const layerGradient =
	'linear-gradient(var(--luke-interaction-state-layer), var(--luke-interaction-state-layer))';
const onSolid = vars.color.foreground.accent.onSolid;

const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space['4'],
		inlineSize: '100%',
		minInlineSize: 0,
	},
	label: {
		// The label reads the root's disabled state through a StyleX ancestor marker. `stylex.when.*`
		// is only compiled inside `stylex.create`; stored in a constant, it throws at runtime.
		color: {
			default: primary,
			[stylex.when.ancestor(':where([data-disabled="true"])')]:
				`var(--luke-internal-foreground-secondary, ${vars.color.foreground.disabled})`,
		},
		fontFamily: vars.font.label.fontFamily,
		fontSize: vars.font.label.fontSize,
		fontWeight: vars.font.label.fontWeight,
		letterSpacing: vars.font.label.letterSpacing,
		lineHeight: vars.font.label.lineHeight,
		minInlineSize: 0,
	},
	message: {
		fontFamily: vars.font.label.fontFamily,
		fontSize: vars.font.label.fontSize,
		fontWeight: vars.font.weight.body,
		letterSpacing: vars.font.label.letterSpacing,
		lineHeight: vars.font.label.lineHeight,
		minInlineSize: 0,
	},
	description: { color: secondary },
	error: { color: `var(--luke-internal-foreground-tone, ${vars.color.foreground.danger.rest})` },
	control: {
		alignItems: 'center',
		backgroundColor: { default: vars.color.background.surface.base, [forced]: 'Field' },
		borderColor: {
			default: vars.color.border.control.rest,
			[fieldHover]: vars.color.border.control.hover,
			[fieldInvalid]: vars.color.border.danger.strong,
			[forced]: { default: 'FieldText', [fieldDisabled]: 'GrayText' },
		},
		borderRadius: vars.radius.control,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: { default: vars.shadow.inset, [fieldReadOnly]: 'none', [forced]: 'none' },
		color: {
			default: vars.color.foreground.primary,
			[forced]: { default: 'FieldText', [fieldDisabled]: 'GrayText' },
		},
		cursor: { default: 'text', [fieldDisabled]: 'not-allowed' },
		display: 'inline-flex',
		fontFamily: vars.font.family.body,
		forcedColorAdjust: { [forced]: 'auto' },
		inlineSize: '100%',
		isolation: 'isolate',
		minInlineSize: 0,
		opacity: {
			default: null,
			[fieldDisabled]: vars.interaction.disabledOpacity,
			[forced]: { [fieldDisabled]: 1 },
		},
		outlineColor: {
			default: null,
			[fieldFocus]: 'var(--luke-internal-focus, var(--luke-color-focus))',
			[forced]: { [fieldFocus]: 'Highlight' },
		},
		outlineOffset: { default: null, [fieldFocus]: '2px' },
		outlineStyle: { default: null, [fieldFocus]: 'solid' },
		outlineWidth: { default: null, [fieldFocus]: '2px' },
		overflow: 'visible',
		transitionDuration: vars.motion.feedback.duration,
		transitionProperty: 'background-color, border-color, box-shadow, color',
		transitionTimingFunction: vars.motion.feedback.easing,
		// The surface pairing for `surface.base`, so a ring or text inside reads the field's context.
		'--luke-internal-foreground-primary': 'initial',
		'--luke-internal-foreground-secondary': 'initial',
		'--luke-internal-foreground-tone': 'initial',
		'--luke-internal-focus': { default: 'initial', [fieldFocus]: 'inherit !important' },
		'--luke-internal-surface-fill-rest': vars.color.background.surface.base,
		'--luke-internal-surface-fill-hover': 'var(--luke-interaction-tint-hover)',
		'--luke-internal-surface-fill-pressed': 'var(--luke-interaction-tint-pressed)',
	},
	controlMedium: {
		blockSize: vars.controlSize['40'],
		fontSize: '1rem',
		letterSpacing: '0',
		lineHeight: '1.5rem',
	},
	controlSmall: {
		blockSize: vars.controlSize['32'],
		// iOS Safari zooms into a focused input under 16px.
		fontSize: { default: '0.875rem', [coarse]: '1rem' },
		letterSpacing: '0',
		lineHeight: { default: '1.25rem', [coarse]: '1.5rem' },
	},
	input: {
		appearance: 'none',
		backgroundColor: 'transparent',
		borderStyle: 'none',
		color: { default: vars.color.foreground.primary, ':disabled': vars.color.foreground.disabled },
		cursor: { default: 'text', ':disabled': 'not-allowed' },
		flex: 1,
		font: 'inherit',
		inlineSize: '100%',
		letterSpacing: 'inherit',
		minInlineSize: 0,
		outline: 'none',
		paddingBlock: 0,
		'::placeholder': { color: vars.color.foreground.secondary, opacity: 1 },
	},
	inputMedium: { blockSize: vars.controlSize['40'], paddingInline: vars.space['12'] },
	inputSmall: { blockSize: vars.controlSize['32'], paddingInline: vars.space['8'] },
	// The trigger and the clear button compose this one compiled style instead of each repeating it.
	action: {
		alignItems: 'center',
		appearance: 'none',
		backgroundColor: {
			default: 'transparent',
			[forced]: {
				default: 'ButtonFace',
				[actionHovered]: 'Highlight',
				[actionPressed]: 'Highlight',
			},
		},
		backgroundImage: { default: layerGradient, [forced]: 'none' },
		borderStyle: 'none',
		borderRadius: vars.radius.detail,
		boxShadow: 'none',
		color: {
			default: vars.color.foreground.secondary,
			[stylex.when.ancestor(fieldDisabled)]: vars.color.foreground.disabled,
			[forced]: {
				default: 'ButtonText',
				[actionDisabled]: 'GrayText',
				[actionHovered]: 'HighlightText',
				[actionPressed]: 'HighlightText',
			},
		},
		cursor: { default: null, [actionDisabled]: 'not-allowed' },
		display: 'inline-flex',
		flexShrink: 0,
		font: 'inherit',
		forcedColorAdjust: { [forced]: 'auto' },
		justifyContent: 'center',
		minBlockSize: 'max(1.5rem, 24px)',
		minInlineSize: 'max(1.5rem, 24px)',
		padding: 0,
		touchAction: 'manipulation',
		transitionDuration: vars.motion.feedback.duration,
		transitionProperty: 'background-color, background-image, color, --luke-interaction-state-layer',
		transitionTimingFunction: vars.motion.feedback.easing,
		WebkitTapHighlightColor: 'transparent',
		'--luke-interaction-state-layer': {
			default: 'transparent',
			[actionHovered]: 'var(--luke-interaction-tint-hover)',
			[actionPressed]: 'var(--luke-interaction-tint-pressed)',
		},
	},
	actionMedium: { blockSize: 'max(1.75rem, 24px)', inlineSize: 'max(1.75rem, 24px)' },
	actionSmall: { blockSize: 'max(1.5rem, 24px)', inlineSize: 'max(1.5rem, 24px)' },
	trigger: { marginInline: vars.space['4'] },
	popover: {
		backgroundColor: { default: vars.color.background.surface.raised, [forced]: 'Canvas' },
		borderColor: { default: vars.color.border.decorative, [forced]: 'CanvasText' },
		borderRadius: vars.radius.surface,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: { default: vars.shadow.floating, [forced]: 'none' },
		color: vars.color.foreground.primary,
		display: 'flex',
		flexDirection: 'column',
		forcedColorAdjust: { [forced]: 'auto' },
		inlineSize: 'var(--trigger-width)',
		isolation: 'isolate',
		minInlineSize: 'var(--trigger-width)',
		opacity: { default: 1, [entering]: 0, [exiting]: 0 },
		overflow: 'hidden',
		transitionDuration: { default: '150ms', [exiting]: '100ms' },
		transitionProperty: { default: 'opacity, translate', [reducedMotion]: 'opacity' },
		transitionTimingFunction: vars.motion.enter.easing,
		translate: {
			default: '0 0',
			[entering]: '0 -4px',
			[exiting]: '0 -4px',
			[`${placedTop}:where([data-entering], [data-exiting])`]: '0 4px',
		},
		'--luke-internal-foreground-primary': 'initial',
		'--luke-internal-foreground-secondary': 'initial',
		'--luke-internal-foreground-tone': 'initial',
		'--luke-internal-focus': 'initial',
	},
	listBox: {
		flex: 1,
		inlineSize: '100%',
		margin: 0,
		maxBlockSize: '18.75rem',
		minBlockSize: 0,
		outline: 'none',
		overflow: 'auto',
		padding: vars.space['4'],
	},
	section: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space['4'],
		paddingBlock: vars.space['8'],
	},
	sectionHeading: {
		color: vars.color.foreground.secondary,
		fontFamily: vars.font.label.fontFamily,
		fontSize: vars.font.label.fontSize,
		fontWeight: vars.font.label.fontWeight,
		lineHeight: vars.font.label.lineHeight,
		paddingBlockEnd: vars.space['4'],
		paddingInline: vars.space['12'],
	},
	emptyState: {
		color: vars.color.foreground.secondary,
		paddingBlock: vars.space['24'],
		paddingInline: vars.space['12'],
		textAlign: 'center',
	},
	item: {
		alignItems: 'center',
		backgroundColor: {
			default: 'transparent',
			[itemFocused]: vars.color.background.accent.solid.rest,
			[itemPressed]: vars.color.background.accent.solid.pressed,
			[forced]: { [itemFocused]: 'Highlight', [itemPressed]: 'Highlight' },
		},
		borderRadius: vars.radius.control,
		color: {
			default: vars.color.foreground.primary,
			[itemFocused]: onSolid,
			[itemPressed]: onSolid,
			[itemDisabled]: vars.color.foreground.disabled,
			[forced]: {
				[itemFocused]: 'HighlightText',
				[itemPressed]: 'HighlightText',
				[itemDisabled]: 'GrayText',
			},
		},
		cursor: { default: 'default', [itemDisabled]: 'not-allowed' },
		display: 'flex',
		fontFamily: vars.font.label.fontFamily,
		fontSize: vars.font.label.fontSize,
		fontWeight: vars.font.weight.body,
		forcedColorAdjust: {
			[forced]: { default: 'auto', [itemFocused]: 'none', [itemPressed]: 'none' },
		},
		gap: vars.space['8'],
		inlineSize: '100%',
		letterSpacing: vars.font.label.letterSpacing,
		lineHeight: vars.font.label.lineHeight,
		minInlineSize: 0,
		opacity: {
			default: null,
			[itemDisabled]: vars.interaction.disabledOpacity,
			[forced]: { [itemDisabled]: 1 },
		},
		outlineColor: {
			default: null,
			[itemFocused]: onSolid,
			[itemPressed]: onSolid,
			[forced]: { [itemFocused]: 'HighlightText', [itemPressed]: 'HighlightText' },
		},
		outlineOffset: { default: null, [itemFocused]: '-2px', [itemPressed]: '-2px' },
		outlineStyle: { default: 'none', [itemFocused]: 'solid', [itemPressed]: 'solid' },
		outlineWidth: { default: null, [itemFocused]: '2px', [itemPressed]: '2px' },
		paddingInline: vars.space['12'],
		touchAction: 'manipulation',
		transitionDuration: vars.motion.feedback.duration,
		transitionProperty: 'background-color, color, opacity, outline-color',
		transitionTimingFunction: vars.motion.feedback.easing,
		WebkitTapHighlightColor: 'transparent',
		// The surface pairing for `accent.solid` while the item is active.
		'--luke-internal-foreground-primary': {
			default: null,
			[itemFocused]: onSolid,
			[itemPressed]: onSolid,
		},
		'--luke-internal-foreground-secondary': {
			default: null,
			[itemFocused]: onSolid,
			[itemPressed]: onSolid,
		},
		'--luke-internal-foreground-tone': {
			default: null,
			[itemFocused]: onSolid,
			[itemPressed]: onSolid,
		},
	},
	itemMedium: { minBlockSize: vars.controlSize['40'], paddingBlock: vars.space['8'] },
	itemSmall: { minBlockSize: vars.controlSize['32'], paddingBlock: vars.space['4'] },
	itemCheck: { flexShrink: 0, marginInlineStart: 'auto' },
	icon: { blockSize: '1.25rem', display: 'block', flexShrink: 0, inlineSize: '1.25rem' },
});

type Size = 'small' | 'medium';

function Icon({ path }: { path: string }) {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			viewBox="0 0 24 24"
			{...stylex.props(styles.icon)}
		>
			<path d={path} />
		</svg>
	);
}

const chevronDown = 'M6 9l6 6 6-6';
const close = 'M6 6l12 12M18 6L6 18';
const check = 'M5 12l5 5 9-11';

/** Props for `ComboboxField`. A subset of the Vanilla Extract field's props. */
export interface ComboboxFieldProps<T extends object> extends Omit<
	RacComboBoxProps<T>,
	'children' | 'className'
> {
	children: ReactNode | ((item: T) => ReactNode);
	className?: string;
	description?: ReactNode;
	errorMessage?: ReactNode;
	label: ReactNode;
	placeholder?: string;
	size?: Size;
}

/** Searchable single-select field. Every visual state reads React Aria's data attributes. */
export function ComboboxField<T extends object>(props: ComboboxFieldProps<T>): JSX.Element {
	const {
		children,
		className,
		description,
		errorMessage,
		items,
		label,
		placeholder,
		size = 'medium',
		...rest
	} = props;
	const isInvalid = errorMessage !== undefined && errorMessage !== null && errorMessage !== '';
	const isInteractive = props.isDisabled !== true && props.isReadOnly !== true;
	const root = stylex.props(stylex.defaultMarker(), styles.root);
	return (
		<RacComboBox
			{...rest}
			className={composeClassName(root.className, className)}
			isInvalid={isInvalid}
			items={items}
		>
			<Label {...stylex.props(styles.label)}>{label}</Label>
			<Group
				{...stylex.props(
					styles.control,
					size === 'small' ? styles.controlSmall : styles.controlMedium,
				)}
			>
				<Input
					{...stylex.props(styles.input, size === 'small' ? styles.inputSmall : styles.inputMedium)}
					placeholder={placeholder}
				/>
				{isInteractive ? (
					<RacButton
						aria-label="Clear selection"
						slot={null}
						{...stylex.props(
							styles.action,
							size === 'small' ? styles.actionSmall : styles.actionMedium,
						)}
					>
						<Icon path={close} />
					</RacButton>
				) : null}
				<RacButton
					aria-label="Toggle options"
					{...stylex.props(
						styles.action,
						styles.trigger,
						size === 'small' ? styles.actionSmall : styles.actionMedium,
					)}
				>
					<Icon path={chevronDown} />
				</RacButton>
			</Group>
			{description ? (
				<RacText slot="description" {...stylex.props(styles.message, styles.description)}>
					{description}
				</RacText>
			) : null}
			<FieldError {...stylex.props(styles.message, styles.error)}>{errorMessage}</FieldError>
			<Popover offset={4} {...stylex.props(styles.popover)}>
				<ListBox
					{...stylex.props(styles.listBox)}
					renderEmptyState={() => <div {...stylex.props(styles.emptyState)}>No results</div>}
				>
					{children}
				</ListBox>
			</Popover>
		</RacComboBox>
	);
}

/** Props for `ComboboxItem`. */
export interface ComboboxItemProps<T extends object> extends Omit<
	ListBoxItemProps<T>,
	'className' | 'children'
> {
	children: ReactNode;
	size?: Size;
}

/** A combobox option. Active, pressed, and disabled come from React Aria's data attributes. */
export function ComboboxItem<T extends object>(props: ComboboxItemProps<T>): JSX.Element {
	const { children, size = 'medium', ...rest } = props;
	const textValue = rest.textValue ?? (typeof children === 'string' ? children : undefined);
	return (
		<ListBoxItem
			{...rest}
			// A global rule resets this item's content colours under forced colours. StyleX cannot
			// author descendant selectors, so that rule lives in `global.css` and keys on this marker.
			data-luke-combobox-item=""
			textValue={textValue}
			{...stylex.props(styles.item, size === 'small' ? styles.itemSmall : styles.itemMedium)}
		>
			{({ isSelected }) => (
				<>
					{children}
					{isSelected ? (
						<span {...stylex.props(styles.itemCheck)}>
							<Icon path={check} />
						</span>
					) : null}
				</>
			)}
		</ListBoxItem>
	);
}

/** A labelled group of options. */
export function ComboboxSection(props: { children: ReactNode; title: ReactNode }): JSX.Element {
	return (
		<ListBoxSection {...stylex.props(styles.section)}>
			<Header {...stylex.props(styles.sectionHeading)}>{props.title}</Header>
			{props.children}
		</ListBoxSection>
	);
}
