import type { JSX } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import * as styles from './recipe.css.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';

type _ComboboxInputGroupOmit = DistributiveOmit<RacGroupProps, 'className'>;
interface _ComboboxInputGroupProps extends _ComboboxInputGroupOmit {
	className?: RacGroupProps['className'];
	size?: ComboboxSize;
}

/** Props for the styled combobox input group. */
export type ComboboxInputGroupProps = Prettify<_ComboboxInputGroupProps>;

/** Wrapper for combobox text input + trigger content. */
export function ComboboxInputGroup(props: ComboboxInputGroupProps): JSX.Element {
	const { size: sizeProp, ...groupProps } = props;
	const size = useComboboxSize(sizeProp);

	return (
		<RacGroup
			{...groupProps}
			className={composeRenderProps(groupProps.className, (className) => {
				return styles.comboboxRecipe({ size }).inputGroup(className);
			})}
		/>
	);
}
