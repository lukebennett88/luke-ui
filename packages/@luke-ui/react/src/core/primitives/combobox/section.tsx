import { mergeProps } from '@react-aria/utils';
import type { JSX, ReactNode } from 'react';
import type { ListBoxSectionProps as RacListBoxSectionProps } from 'react-aria-components/ComboBox';
import { ListBoxSection as RacListBoxSection } from 'react-aria-components/ComboBox';
import { Header as RacHeader } from 'react-aria-components/Header';
import { resolveRecipeSlotProps } from '../../styles/recipe-authoring.js';
import type { XStyleProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { comboboxRecipe } from './recipe.js';
import { comboboxSectionScopeAttribute } from './section-scope.js';

type _ComboboxSectionOmit<T extends object> = DistributiveOmit<
	RacListBoxSectionProps<T>,
	'className'
>;

interface _ComboboxSectionProps<T extends object> extends _ComboboxSectionOmit<T>, XStyleProps {
	className?: RacListBoxSectionProps<T>['className'];
	title?: ReactNode;
}

/** Props for a combobox section grouping. */
export type ComboboxSectionProps<T extends object> = Prettify<_ComboboxSectionProps<T>>;

export function ComboboxSection<T extends object>(props: ComboboxSectionProps<T>): JSX.Element {
	const { children, className, style, title, xstyle, ...sectionProps } = props;
	const resolved = mergeProps(
		resolveRecipeSlotProps(comboboxRecipe, 'section', undefined, xstyle),
		{ className, style },
	);
	if (typeof children === 'function') {
		return (
			<RacListBoxSection
				{...sectionProps}
				{...{ [comboboxSectionScopeAttribute]: '' }}
				{...resolved}
			>
				{children}
			</RacListBoxSection>
		);
	}

	return (
		<RacListBoxSection {...sectionProps} {...{ [comboboxSectionScopeAttribute]: '' }} {...resolved}>
			{title != null ? (
				<RacHeader {...resolveRecipeSlotProps(comboboxRecipe, 'sectionHeading')}>{title}</RacHeader>
			) : null}
			{children}
		</RacListBoxSection>
	);
}
