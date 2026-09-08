import type { JSX } from 'react';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../shared/utils/utils.js';
import type { IconName } from '../icon/icon.js';
import { Icon } from '../icon/icon.js';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.js';
import type { ButtonProps as PrimitiveButtonProps } from '../primitives/button/button.js';
import { Button } from '../primitives/button/button.js';
import { pendingSpinnerOverlay } from '../styles/pending-spinner-overlay.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import type { PressAction } from '../use-press-action/use-press-action.js';
import { usePressAction } from '../use-press-action/use-press-action.js';
import type { IconButtonRecipeVariants } from './recipe.css.js';
import { iconButtonIcon, iconButtonRecipe, iconButtonReset } from './recipe.css.js';

interface IconButtonRecipeProps extends NonNullable<IconButtonRecipeVariants> {}

interface IconButtonStyleProps {
	/**
	 * Externally owned pending state. When true, the button is non-interactive and shows a spinner
	 * immediately. Prefer `pressAction` for IconButton-owned work.
	 * @default false
	 */
	isPending?: boolean;
	/**
	 * IconButton-owned work run as a React Action. The button becomes pending automatically until
	 * the Action settles. Use `onPress` for the synchronous interaction; use `pressAction` for the
	 * resulting operation.
	 */
	pressAction?: PressAction;
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: IconButtonRecipeProps['size'];
}

type _IconButtonOmit = DistributiveOmit<
	PrimitiveButtonProps,
	'isBlock' | 'isPending' | 'size' | keyof DocumentedPressProps
>;

interface _IconButtonProps extends _IconButtonOmit, IconButtonStyleProps, DocumentedPressProps {
	/** Icon name from the generated icon set. */
	icon: IconName;
}

/** Props for `IconButton`. */
export type IconButtonProps = Prettify<_IconButtonProps>;

/** Button that renders only an icon. */
export function IconButton(props: IconButtonProps): JSX.Element {
	const { icon, isPending = false, onPress, pressAction, size = 'medium', ...buttonProps } = props;
	const {
		isPendingState,
		onPress: handlePress,
		showSpinner,
	} = usePressAction({ isPending, onPress, pressAction });

	return (
		<Button
			{...buttonProps}
			className={composeRenderProps(props.className, (value) => {
				return cx(iconButtonReset, iconButtonRecipe({ className: value, size }));
			})}
			isPending={isPendingState}
			onPress={handlePress}
			size={size}
		>
			{showSpinner && (
				<span aria-hidden className={pendingSpinnerOverlay()}>
					<LoadingSpinner aria-hidden />
				</span>
			)}
			<Icon aria-hidden className={iconButtonIcon({ isPending: showSpinner })} name={icon} />
		</Button>
	);
}
