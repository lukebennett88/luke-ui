import type { JSX } from 'react';
import { createContext, use } from 'react';
import type { LabelProps as RacLabelProps } from 'react-aria-components/Label';
import { Label as RacLabel } from 'react-aria-components/Label';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { NecessityIndicator } from './necessity-context.js';
import { FormNecessityContext } from './necessity-context.js';
import { fieldRecipe } from './recipe.css.js';

interface FieldState {
	isRequired: boolean;
}

/** Required state from the nearest semantic control root, or `null` when no root is present. */
export const FieldStateContext = createContext<FieldState | null>(null);

interface FieldLabelStyleProps {
	/**
	 * Describes whether the associated control is required. It does not make the control required.
	 * Inside a Luke UI control root, the root's required state wins.
	 */
	isRequired?: boolean;
	/**
	 * Controls how the label identifies required or optional values. Inherits from `Form`, or uses
	 * `'required-asterisk'` when unset.
	 */
	necessityIndicator?: NecessityIndicator;
}

type _FieldLabelOmit = DistributiveOmit<RacLabelProps, 'elementType' | 'htmlFor' | 'render'>;

interface FieldLabelSharedProps extends _FieldLabelOmit, FieldLabelStyleProps {
	/** Associates the label with a form control. */
	htmlFor?: RacLabelProps['htmlFor'];
}

interface FieldLabelElementProps extends FieldLabelSharedProps {
	/** Renders a different element type in place of the default. */
	elementType?: RacLabelProps['elementType'];
	/** Use `renderRoot` instead of `elementType` to own the rendered element. */
	renderRoot?: never;
}

interface FieldLabelRenderRootProps extends FieldLabelSharedProps {
	/** Use `elementType` instead of `renderRoot` for a supported semantic element. */
	elementType?: never;
	/**
	 * Passes resolved DOM props to a caller-owned label root element.
	 */
	renderRoot: NonNullable<RacLabelProps['render']>;
}

/** Props for `FieldLabel`. */
export type FieldLabelProps = Prettify<FieldLabelElementProps | FieldLabelRenderRootProps>;

/**
 * Styled label for form fields.
 *
 * Inside a control root such as `TextInputRoot`, `SwitchRoot`, or `CheckboxRoot`, it connects to the
 * control automatically. In a switch or checkbox root, clicking it toggles the control. Do not also
 * put label text in `SwitchLabel` or `CheckboxLabel`, which draw no required marker.
 *
 * It draws the necessity marker when the control root is required or optional, depending on
 * `necessityIndicator`.
 */
export function FieldLabel(props: FieldLabelProps): JSX.Element {
	const {
		children,
		className,
		elementType,
		isRequired,
		necessityIndicator: necessityIndicatorProp,
		renderRoot,
		...restProps
	} = props;
	const necessityIndicator = useNecessityIndicator(necessityIndicatorProp);

	return (
		<RacLabel
			{...restProps}
			className={fieldRecipe({ necessityIndicator }).label({ className })}
			elementType={renderRoot ? undefined : elementType}
			render={renderRoot}
		>
			{children}
			<NecessityMarker isRequired={isRequired} necessityIndicator={necessityIndicator} />
		</RacLabel>
	);
}

/** Resolves the marker mode for a label part: local prop, nearest Form, then the default. */
export function useNecessityIndicator(prop: NecessityIndicator | undefined): NecessityIndicator {
	const fromForm = use(FormNecessityContext);
	return prop ?? fromForm ?? 'required-asterisk';
}

/** Resolves requiredness, with the nearest control root taking precedence. */
function useResolvedIsRequired(propIsRequired: boolean | undefined): boolean | undefined {
	const context = use(FieldStateContext);

	return context?.isRequired ?? propIsRequired;
}

// Joins the marker to the label's last word without allowing a line break.
const NON_BREAKING_SPACE = '\u00A0';

const NECESSITY_MARKER_TEXT = {
	'required-asterisk': '*',
	'required-label': '(required)',
	'optional-label': '(optional)',
} as const satisfies Record<NecessityIndicator, string>;

/**
 * Adds the configured required or optional marker after the label text. Required markers are hidden
 * from assistive technology. Optional markers are included in the accessible name.
 */
export function NecessityMarker(props: {
	isRequired?: boolean;
	necessityIndicator: NecessityIndicator;
}): JSX.Element | null {
	const { isRequired: propIsRequired, necessityIndicator } = props;
	const isRequired = useResolvedIsRequired(propIsRequired);

	const shouldHideFromAssistiveTechnology =
		necessityIndicator === 'required-asterisk' || necessityIndicator === 'required-label';
	const shouldRender =
		(shouldHideFromAssistiveTechnology && isRequired === true) ||
		(necessityIndicator === 'optional-label' && isRequired === false);

	if (!shouldRender) return null;

	const marker = NECESSITY_MARKER_TEXT[necessityIndicator];
	const className = fieldRecipe({ necessityIndicator }).necessityMarker();

	if (necessityIndicator === 'optional-label') {
		// Keep the optional space outside the span because dom-accessibility-api trims element text.
		return (
			<>
				{NON_BREAKING_SPACE}
				<span className={className}>{marker}</span>
			</>
		);
	}

	return (
		<span aria-hidden className={className}>
			{NON_BREAKING_SPACE}
			{marker}
		</span>
	);
}
