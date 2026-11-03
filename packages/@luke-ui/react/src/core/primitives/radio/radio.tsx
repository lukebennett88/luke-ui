import type { ComponentProps, JSX, Ref } from 'react';
import { createContext, use, useId } from 'react';
import type {
	RadioButtonProps as RacRadioButtonProps,
	RadioFieldProps as RacRadioFieldProps,
	RadioGroupProps as RacRadioGroupProps,
} from 'react-aria-components/RadioGroup';
import {
	RadioButton as RacRadioButton,
	RadioField as RacRadioField,
	RadioGroup as RacRadioGroup,
	RadioGroupContext,
} from 'react-aria-components/RadioGroup';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { useSlottedContext } from 'react-aria-components/slots';
import { useControlSize } from '../../sizing/control-size-context.js';
import type { ControlSize } from '../../sizing/control-size.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { FieldStateContext } from '../field/label.js';
import { fieldRecipe } from '../field/recipe.css.js';
import { rootIdProps } from '../root-id.js';
import type { RadioRecipeVariants } from './styles.css.js';
import { radioRecipe } from './styles.css.js';

const RadioSizeContext = createContext<ControlSize | null>(null);

type _RadioGroupRootOmit = DistributiveOmit<
	RacRadioGroupProps,
	'children' | 'className' | 'render'
>;

interface _RadioGroupRootProps extends _RadioGroupRootOmit {
	/** The group label, description, error, and radio options. */
	children: RacRadioGroupProps['children'];
	/** Class name for the group root. */
	className?: RacRadioGroupProps['className'];
	/** Selected option value when the group is controlled. */
	value?: RacRadioGroupProps['value'];
	/**
	 * Visual size supplied to options that do not set their own size.
	 *
	 * @default 'medium'
	 */
	size?: ControlSize;
	/** Forwarded to the group root element. */
	ref?: Ref<HTMLDivElement>;
}

/** Props for `RadioGroupRoot`. */
export type RadioGroupRootProps = Prettify<_RadioGroupRootProps>;

/**
 * Semantic root for a radio group. It owns selection, validation, orientation, and the default size
 * for its options.
 */
export function RadioGroupRoot(props: RadioGroupRootProps): JSX.Element {
	const { children, className, isRequired, size: sizeProp, ...groupProps } = props;
	const size = useControlSize(sizeProp);
	const groupContext = useSlottedContext(RadioGroupContext, props.slot);
	const resolvedIsRequired = isRequired ?? groupContext?.isRequired ?? false;

	return (
		<FieldStateContext.Provider value={{ isRequired: resolvedIsRequired }}>
			<RadioSizeContext.Provider value={size}>
				<RacRadioGroup
					{...groupProps}
					className={composeRenderProps(className, (renderedClassName) => {
						return radioRecipe().group({ className: renderedClassName });
					})}
					isRequired={isRequired}
				>
					{children}
				</RacRadioGroup>
			</RadioSizeContext.Provider>
		</FieldStateContext.Provider>
	);
}

type _RadioRootOmit = DistributiveOmit<
	RacRadioFieldProps,
	'children' | 'className' | 'id' | 'inputRef' | 'render'
>;

interface _RadioRootProps extends _RadioRootOmit {
	/** Radio label, control, and optional description. */
	children: RacRadioFieldProps['children'];
	/** Class name for the option root. */
	className?: RacRadioFieldProps['className'];
	/** Value submitted when this option is selected. */
	value: RacRadioFieldProps['value'];
	/** Element id for the option root. Use `inputId` for the radio input. */
	id?: string;
	/** Element id for the input. */
	inputId?: RacRadioFieldProps['id'];
	/** Forwarded to the hidden radio input. */
	inputRef?: RacRadioFieldProps['inputRef'];
	/** Forwarded to the option root element. */
	ref?: Ref<HTMLDivElement>;
	/**
	 * Visual size of the radio option. Defaults to the group size, then `Form.controlSize`, then
	 * `medium`.
	 */
	size?: RadioRecipeVariants['size'];
}

/** Props for `RadioRoot`. */
export type RadioRootProps = Prettify<_RadioRootProps>;

/** Semantic root for one radio option. It renders a labelled hidden input and option description. */
export function RadioRoot(props: RadioRootProps): JSX.Element {
	const { children, className, id, inputId, inputRef, size: sizeProp, ...radioProps } = props;
	const generatedInputId = useId();
	const groupSize = use(RadioSizeContext);
	const inheritedSize = useControlSize();
	const size = sizeProp ?? groupSize ?? inheritedSize;

	return (
		<RadioSizeContext.Provider value={size}>
			<RacRadioField
				{...radioProps}
				{...rootIdProps(id, inputId ?? generatedInputId)}
				className={composeRenderProps(className, (renderedClassName) => {
					return radioRecipe({ size }).root({ className: renderedClassName });
				})}
				data-size={size}
				inputRef={inputRef}
			>
				{children}
			</RacRadioField>
		</RadioSizeContext.Provider>
	);
}

type _RadioLabelProps = DistributiveOmit<RacRadioButtonProps, 'className' | 'render'> & {
	/** Class name for the clickable label. */
	className?: RacRadioButtonProps['className'];
	/** Forwarded to the clickable `<label>` element. */
	ref?: Ref<HTMLLabelElement>;
};

/** Props for `RadioLabel`. */
export type RadioLabelProps = Prettify<_RadioLabelProps>;

/** The clickable label that contains `RadioControl` and the option text. */
export function RadioLabel(props: RadioLabelProps): JSX.Element {
	const { className, ...labelProps } = props;

	return (
		<RacRadioButton
			{...labelProps}
			className={composeRenderProps(className, (renderedClassName) => {
				return fieldRecipe().inlineLabel({ className: renderedClassName });
			})}
		/>
	);
}

interface _RadioControlProps extends ComponentProps<'span'> {}

/** Props for `RadioControl`. */
export type RadioControlProps = Prettify<_RadioControlProps>;

/** Line-height-sized wrapper that centres the visual radio indicator. */
export function RadioControl(props: RadioControlProps): JSX.Element {
	const { className, ...restProps } = props;

	return <span {...restProps} className={radioRecipe().control({ className })} />;
}

interface _RadioIndicatorProps extends DistributiveOmit<ComponentProps<'span'>, 'children'> {}

/** Props for `RadioIndicator`. */
export type RadioIndicatorProps = Prettify<_RadioIndicatorProps>;

/** Circular visual that shows whether its radio option is selected. */
export function RadioIndicator(props: RadioIndicatorProps): JSX.Element {
	const { className, ...restProps } = props;
	const slots = radioRecipe();

	return (
		<span {...restProps} aria-hidden className={slots.indicator({ className })}>
			<span className={slots.mark()} />
		</span>
	);
}
