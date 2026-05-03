import type { JSX } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../recipes/combobox.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import { cx } from '../utils/index.js';

interface ComboboxVariantProps extends NonNullable<styles.ComboboxVariants> {}

interface ComboboxStyleProps {
	/** Control size. */
	size?: ComboboxVariantProps['size'];
}

/** Props for the styled combobox control group. */
export interface ComboboxControlProps
	extends DistributiveOmit<RacGroupProps, 'className'>, ComboboxStyleProps {
	className?: RacGroupProps['className'];
}

/** Control wrapper for combobox text input + trigger content. */
export function ComboboxControl(props: ComboboxControlProps): JSX.Element {
	const { size = 'medium', ...groupProps } = props;

	return (
		<RacGroup
			{...groupProps}
			className={composeRenderProps(groupProps.className, (className) => {
				return cx(styles.comboboxControl({ size }), className);
			})}
		/>
	);
}
