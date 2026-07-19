import type { JSX } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/combobox.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { cx } from '../../utils/index.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';

type _ComboboxControlOmit = DistributiveOmit<RacGroupProps, 'className'>;
interface _ComboboxControlProps extends _ComboboxControlOmit {
	className?: RacGroupProps['className'];
	size?: ComboboxSize;
}

/**
 * Props for the styled combobox control group.
 *
 * @tier primitive
 */
export type ComboboxControlProps = Prettify<_ComboboxControlProps>;

/** Control wrapper for combobox text input + trigger content. */
export function ComboboxControl(props: ComboboxControlProps): JSX.Element {
	const { size: sizeProp, ...groupProps } = props;
	const size = useComboboxSize(sizeProp);
	const comboboxStyles = styles.combobox({ size });

	return (
		<RacGroup
			{...groupProps}
			className={composeRenderProps(groupProps.className, (className) => {
				return cx(comboboxStyles.control, className);
			})}
		/>
	);
}
