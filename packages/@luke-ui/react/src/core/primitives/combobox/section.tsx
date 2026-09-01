import type { JSX, ReactNode } from 'react';
import type { ListBoxSectionProps as RacListBoxSectionProps } from 'react-aria-components/ComboBox';
import { ListBoxSection as RacListBoxSection } from 'react-aria-components/ComboBox';
import { Header as RacHeader } from 'react-aria-components/Header';
import { cx } from '../../../shared/utils/utils.js';
import type { XStyleProp } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { comboboxRecipe, resolveComboboxRecipeStyles } from './recipe.js';
import { comboboxSectionScopeClassName } from './section-scope.js';

type _ComboboxSectionOmit<T extends object> = DistributiveOmit<
	RacListBoxSectionProps<T>,
	'className'
>;

interface _ComboboxSectionProps<T extends object> extends _ComboboxSectionOmit<T> {
	className?: RacListBoxSectionProps<T>['className'];
	title?: ReactNode;
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after `ComboboxSection`'s
	 * own styles and before `className`. A same-property `xstyle` value wins over those styles. A
	 * consumer `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

/** Props for a combobox section grouping. */
export type ComboboxSectionProps<T extends object> = Prettify<_ComboboxSectionProps<T>>;

export function ComboboxSection<T extends object>(props: ComboboxSectionProps<T>): JSX.Element {
	const { children, className, style, title, xstyle, ...sectionProps } = props;
	const resolved = resolveXStyleProps(
		resolveComboboxRecipeStyles().section,
		xstyle,
		className,
		style,
	);
	const sectionClassName = cx(comboboxSectionScopeClassName, resolved.className);

	if (typeof children === 'function') {
		return (
			<RacListBoxSection {...sectionProps} className={sectionClassName} style={resolved.style}>
				{children}
			</RacListBoxSection>
		);
	}

	return (
		<RacListBoxSection {...sectionProps} className={sectionClassName} style={resolved.style}>
			{title != null ? (
				<RacHeader className={comboboxRecipe().sectionHeading()}>{title}</RacHeader>
			) : null}
			{children}
		</RacListBoxSection>
	);
}
