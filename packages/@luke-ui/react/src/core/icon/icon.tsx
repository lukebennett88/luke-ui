import type { HTMLAttributes, JSX } from 'react';
import { iconNames } from '../../../.generated/icon-data.js';
import type { IconName } from '../../../.generated/icon-data.js';
import { cx } from '../../shared/utils/utils.js';
import type { Prettify } from '../types/prettify.js';
import type { IconRecipeVariants } from './recipe.css.js';
import { iconRecipe } from './recipe.css.js';
import { iconMask } from './styles.css.js';

export type { IconName };
export { iconNames };

interface _IconProps extends Pick<
	HTMLAttributes<HTMLSpanElement>,
	'aria-hidden' | 'className' | 'id' | 'style'
> {
	/** Icon name from the built-in icon set. */
	name: IconName;
	/**
	 * Sets the icon size. Without it, the icon takes the size its container sets, such as `xsmall`
	 * inside a Button, or `medium` elsewhere.
	 */
	size?: NonNullable<IconRecipeVariants>['size'];
	/** Accessible label. When set, the icon is announced as an image. */
	title?: string;
}

/** Props for the built-in `Icon` component. */
export type IconProps = Prettify<_IconProps>;

/** Renders a built-in icon. The stylesheet paints it, so it needs no provider or extra asset. */
export function Icon(props: IconProps): JSX.Element {
	const { 'aria-hidden': ariaHiddenProp, className, id, name, size, style, title } = props;
	// `aria-hidden={false}` and `aria-hidden="false"` are accepted by the prop type but must never
	// reach the DOM, so any non-`true` value is treated as unset.
	const isHidden = ariaHiddenProp === true || ariaHiddenProp === 'true' || !title;

	return (
		<span
			aria-hidden={isHidden ? true : undefined}
			aria-label={isHidden ? undefined : title}
			className={cx(iconMask, iconRecipe({ className, size }))}
			data-icon={name}
			id={id}
			role={isHidden ? undefined : 'img'}
			style={style}
		/>
	);
}
