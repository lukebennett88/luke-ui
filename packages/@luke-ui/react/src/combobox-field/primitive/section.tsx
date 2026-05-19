import type { JSX, ReactNode } from 'react';
import type { ListBoxSectionProps as RacListBoxSectionProps } from 'react-aria-components/ComboBox';
import { ListBoxSection as RacListBoxSection } from 'react-aria-components/ComboBox';
import { Header as RacHeader } from 'react-aria-components/Header';
import * as styles from '../../recipes/combobox.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import { cx } from '../../utils/index.js';

/**
 * Props for a combobox section grouping.
 *
 * @tier primitive
 */
export interface ComboboxSectionProps<T extends object> extends DistributiveOmit<
	RacListBoxSectionProps<T>,
	'className'
> {
	className?: RacListBoxSectionProps<T>['className'];
	title?: ReactNode;
}

export function ComboboxSection<T extends object>(props: ComboboxSectionProps<T>): JSX.Element {
	const { children, className, title, ...sectionProps } = props;

	const sectionClassName = cx(styles.comboboxSection(), className);

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
				<RacHeader className={styles.comboboxSectionHeading}>{title}</RacHeader>
			) : null}
			{children}
		</RacListBoxSection>
	);
}
