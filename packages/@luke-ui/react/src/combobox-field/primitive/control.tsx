import type { JSX } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/combobox.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import { cx } from '../../utils/index.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';

/**
 * Props for the styled combobox control group.
 *
 * @tier primitive
 */
export interface ComboboxControlProps extends DistributiveOmit<RacGroupProps, 'className'> {
	className?: RacGroupProps['className'];
	size?: ComboboxSize;
}

/** Control wrapper for combobox text input + trigger content. */
export function ComboboxControl(props: ComboboxControlProps): JSX.Element {
	const { size: sizeProp, ...groupProps } = props;
	const size = useComboboxSize(sizeProp);

	return (
		<RacGroup
			{...groupProps}
			className={composeRenderProps(groupProps.className, (className) => {
				return cx(styles.comboboxControl({ size }), className);
			})}
		/>
	);
}
