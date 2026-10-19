import type { JSX, ReactNode } from 'react';
import type { ListBoxSectionProps as RacListBoxSectionProps } from 'react-aria-components/ComboBox';
import { ListBoxSection as RacListBoxSection } from 'react-aria-components/ComboBox';
import { Header as RacHeader } from 'react-aria-components/Header';
import { cx } from '../../../shared/utils/utils.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { comboboxSectionScopeClassName } from './section-scope.css.js';
import { comboboxRecipe } from './styles.css.js';

type _ComboboxSectionOmit<T extends object> = DistributiveOmit<
	RacListBoxSectionProps<T>,
	'className' | 'render'
>;

interface _ComboboxSectionProps<T extends object> extends _ComboboxSectionOmit<T> {
	className?: RacListBoxSectionProps<T>['className'];
	/**
	 * Passes resolved DOM props to a caller-owned section root element.
	 */
	renderRoot?: RacListBoxSectionProps<T>['render'];
	title?: ReactNode;
}

/** Props for a combobox section grouping. */
export type ComboboxSectionProps<T extends object> = Prettify<_ComboboxSectionProps<T>>;

export function ComboboxSection<T extends object>(props: ComboboxSectionProps<T>): JSX.Element {
	const { children, className, renderRoot, title, ...sectionProps } = props;

	const sectionClassName = cx(
		comboboxSectionScopeClassName,
		comboboxRecipe().section({ className }),
	);

	if (typeof children === 'function') {
		return (
			<RacListBoxSection {...sectionProps} className={sectionClassName} render={renderRoot}>
				{children}
			</RacListBoxSection>
		);
	}

	return (
		<RacListBoxSection {...sectionProps} className={sectionClassName} render={renderRoot}>
			{title != null ? (
				<RacHeader className={comboboxRecipe().sectionHeading()}>{title}</RacHeader>
			) : null}
			{children}
		</RacListBoxSection>
	);
}
