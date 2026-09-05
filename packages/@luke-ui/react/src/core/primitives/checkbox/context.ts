import { createContext, use } from 'react';
import type { CheckboxButtonRenderProps } from 'react-aria-components/Checkbox';

export type CheckboxState = Pick<
	CheckboxButtonRenderProps,
	| 'isSelected'
	| 'isIndeterminate'
	| 'isHovered'
	| 'isPressed'
	| 'isFocusVisible'
	| 'isDisabled'
	| 'isReadOnly'
	| 'isInvalid'
>;

export const CheckboxStateContext = createContext<CheckboxState | null>(null);

export function useCheckboxState(): CheckboxState {
	return (
		use(CheckboxStateContext) ?? {
			isDisabled: false,
			isFocusVisible: false,
			isHovered: false,
			isIndeterminate: false,
			isInvalid: false,
			isPressed: false,
			isReadOnly: false,
			isSelected: false,
		}
	);
}
