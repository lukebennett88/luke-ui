import type { JSX, Ref } from 'react';
import { useContext } from 'react';
import type { InputProps as RacInputProps } from 'react-aria-components/ComboBox';
import { ComboBoxStateContext, Input as RacInput } from 'react-aria-components/ComboBox';
import { resolveRecipeSlotProps } from '../../styles/recipe-authoring.js';
import type { XStyleProps } from '../../styles/xstyle.js';
import { composeRacRecipeProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxSize } from './recipe.js';
import { comboboxRecipe } from './recipe.js';
import { useComboboxSize } from './size-context.js';

type _ComboboxInputOmit = DistributiveOmit<RacInputProps, 'className' | 'size'>;
interface _ComboboxInputProps extends _ComboboxInputOmit, XStyleProps {
	className?: RacInputProps['className'];
	/**
	 * Forwarded to the underlying `<input>` element. Accepts a callback ref or a ref
	 * object, so form libraries that hand out callback refs work without a bridge.
	 */
	ref?: Ref<HTMLInputElement>;
	size?: ComboboxSize;
}

/** Props for the styled combobox text input. */
export type ComboboxInputProps = Prettify<_ComboboxInputProps>;

/** Text input used within `ComboboxInputGroup` for combobox behavior. */
export function ComboboxInput(props: ComboboxInputProps): JSX.Element {
	const { onClick, size: sizeProp, style, xstyle, ...inputProps } = props;
	const size = useComboboxSize(sizeProp);
	const state = useContext(ComboBoxStateContext);
	const recipeProps = resolveRecipeSlotProps(comboboxRecipe, 'textInput', { size }, xstyle);

	const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
		onClick?.(event);
		if (!state?.isOpen) {
			state?.open();
		}
	};

	return (
		<RacInput
			{...inputProps}
			{...composeRacRecipeProps(recipeProps, inputProps.className, style)}
			onClick={handleClick}
		/>
	);
}
