import type { JSX, ReactNode } from 'react';
import type { ListBoxSectionProps as RacListBoxSectionProps } from 'react-aria-components/ComboBox';
import { ListBoxSection as RacListBoxSection } from 'react-aria-components/ComboBox';
import { Header as RacHeader } from 'react-aria-components/Header';
import * as styles from '../../recipes/combobox.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';

type _ComboboxSectionOmit<T extends object> = DistributiveOmit<
	RacListBoxSectionProps<T>,
	'className'
>;

interface _ComboboxSectionProps<T extends object> extends _ComboboxSectionOmit<T> {
	className?: RacListBoxSectionProps<T>['className'];
	title?: ReactNode;
}

/**
 * Props for a combobox section grouping.
 *
 * @tier primitive
 */
export type ComboboxSectionProps<T extends object> = Prettify<_ComboboxSectionProps<T>>;

export function ComboboxSection<T extends object>(props: ComboboxSectionProps<T>): JSX.Element {
	const { children, className, title, ...sectionProps } = props;

	const sectionClassName = styles.combobox().section(className);

	if (typeof children === 'function') {
		return (
			<RacListBoxSection {...sectionProps} className={sectionClassName}>
				{children}
			</RacListBoxSection>
		);
	}

	return (
		<RacListBoxSection {...sectionProps} className={sectionClassName}>
			{title != null ? (
				<RacHeader className={styles.combobox().sectionHeading()}>{title}</RacHeader>
			) : null}
			{children}
		</RacListBoxSection>
	);
}
