import { typedEntries } from '../../shared/utils/utils.js';
import type { CreateSprinkles, SprinklesProps } from './utilities.css.js';
import { backgroundColorClasses, sprinkles } from './utilities.css.js';

function backgroundColorClassName(value: SprinklesProps['backgroundColor']): string {
	if (value == null) return '';
	if (typeof value === 'string') return backgroundColorClasses.initial[value] ?? '';

	const classNames: Array<string> = [];
	for (const [condition, token] of typedEntries(value)) {
		// An omitted or empty value gets no class, so the previous condition's background holds.
		const className = token ? backgroundColorClasses[condition]?.[token] : undefined;
		if (className) classNames.push(className);
	}
	return classNames.join(' ');
}

/**
 * Package-internal utilities for `Box` and the layout components. A background comes from paired
 * classes rather than an inline value, so the fill, the text colour, and the foreground context
 * always change together.
 */
export const createSprinkles = Object.assign(
	(props: Record<string, unknown>) => {
		const { backgroundColor, ...otherProps } = props;
		const result = sprinkles(otherProps);
		const backgroundClassName = backgroundColorClassName(
			backgroundColor as SprinklesProps['backgroundColor'],
		);
		if (!backgroundClassName) return result;

		return { ...result, className: `${result.className} ${backgroundClassName}`.trim() };
	},
	{ properties: new Set([...sprinkles.properties, 'backgroundColor']) },
) as unknown as CreateSprinkles;
