import type { JSX, Ref } from 'react';
import type { Key, ComboBoxProps as RacComboBoxProps } from 'react-aria-components/ComboBox';
import { ComboBox as RacComboBox } from 'react-aria-components/ComboBox';
import { resolveRecipeSlotProps } from '../../styles/recipe-authoring.js';
import type { XStyleProps } from '../../styles/xstyle.js';
import { composeRacRecipeProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxSize } from './recipe.js';
import { comboboxRecipe } from './recipe.js';
import { ComboboxSizeProvider } from './size-context.js';

export type { ComboboxSize };

/** RAC combobox props redeclared here with useful JSDoc; kept local since this is the only combobox primitive that documents them. */
interface ComboboxRootRedeclaredRACProps<T extends object> {
	/** Whether the combobox should receive focus on render. */
	autoFocus?: RacComboBoxProps<T, 'single'>['autoFocus'];
	/** The `<form>` element to associate the combobox with, by id. */
	form?: RacComboBoxProps<T, 'single'>['form'];
	/** Whether the combobox is disabled. */
	isDisabled?: RacComboBoxProps<T, 'single'>['isDisabled'];
	/** Marks the combobox invalid, e.g. after failed validation. */
	isInvalid?: RacComboBoxProps<T, 'single'>['isInvalid'];
	/** Whether the combobox can be read but not changed. */
	isReadOnly?: RacComboBoxProps<T, 'single'>['isReadOnly'];
	/** Whether the combobox is required before the form can submit. */
	isRequired?: RacComboBoxProps<T, 'single'>['isRequired'];
	/** The name of the combobox's hidden input, used when submitting an HTML form. */
	name?: RacComboBoxProps<T, 'single'>['name'];
	/** Custom validation function run against the current value. Return a message, or `true`/`null` when valid. */
	validate?: RacComboBoxProps<T, 'single'>['validate'];
	/**
	 * When native HTML form validation runs.
	 * @default 'native'
	 */
	validationBehavior?: RacComboBoxProps<T, 'single'>['validationBehavior'];
}

type _ComboboxRootOmit<T extends object> = DistributiveOmit<
	RacComboBoxProps<T, 'single'>,
	| 'defaultSelectedKey'
	| 'defaultValue'
	| 'onChange'
	| 'onOpenChange'
	| 'onSelectionChange'
	| 'selectedKey'
	| 'selectionMode'
	| 'value'
	| keyof ComboboxRootRedeclaredRACProps<T>
>;

interface _ComboboxRootProps<T extends object>
	extends _ComboboxRootOmit<T>, ComboboxRootRedeclaredRACProps<T>, XStyleProps {
	/** The initially selected key (uncontrolled). */
	defaultValue?: Key | null;

	/**
	 * The interaction required to display the ComboBox menu.
	 * @default 'focus'
	 */
	menuTrigger?: 'focus' | 'input' | 'manual';

	/** Called when the selected value changes. */
	onChange?: (value: Key | null) => void;

	/** Called when the open state changes. */
	onOpenChange?: (isOpen: boolean) => void;
	/** Forwarded to the combobox root element. */
	ref?: Ref<HTMLDivElement>;

	/** Control size. @default 'medium' */
	size?: ComboboxSize;
	/** The currently selected key (controlled). Pass `null` for no selection. */
	value?: Key | null;
}

/** Props for the primitive combobox root. */
export type ComboboxRootProps<T extends object> = Prettify<_ComboboxRootProps<T>>;

export function ComboboxRoot<T extends object>(props: ComboboxRootProps<T>): JSX.Element {
	const {
		className,
		menuTrigger = 'focus',
		ref,
		size = 'medium',
		style,
		xstyle,
		...comboboxProps
	} = props;
	const recipeProps = resolveRecipeSlotProps(comboboxRecipe, 'root', { size }, xstyle);

	return (
		<ComboboxSizeProvider size={size}>
			<RacComboBox
				{...comboboxProps}
				{...composeRacRecipeProps(recipeProps, className, style)}
				menuTrigger={menuTrigger}
				ref={ref}
			/>
		</ComboboxSizeProvider>
	);
}
