import type { JSX } from 'react';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../shared/utils/utils.js';
import type { IconName } from '../icon/icon.js';
import { Icon } from '../icon/icon.js';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.js';
import type { ButtonProps as PrimitiveButtonProps } from '../primitives/button/button.js';
import { Button } from '../primitives/button/button.js';
import type * as primitiveStyles from '../primitives/button/recipe.css.js';
import { pendingSpinnerOverlay } from '../styles/pending-spinner-overlay.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import type { PressAction } from '../use-press-action/use-press-action.js';
import { usePressAction } from '../use-press-action/use-press-action.js';
import type { IconButtonRecipeVariants } from './recipe.css.js';
import { iconButtonIcon, iconButtonRecipe, iconButtonReset } from './recipe.css.js';

interface IconButtonRecipeProps extends NonNullable<IconButtonRecipeVariants> {}
interface PrimitiveButtonRecipeProps extends NonNullable<primitiveStyles.ButtonRecipeVariants> {}

interface IconButtonBaseProps {
	/**
	 * Chooses the button-shaped presentation.
	 * @default 'button'
	 */
	appearance?: 'button';
	/**
	 * Externally owned pending state. When true, the button is non-interactive and shows a spinner
	 * immediately. Prefer `pressAction` for IconButton-owned operations.
	 * @default false
	 */
	isPending?: boolean;
	/**
	 * IconButton-owned operation run as a React Action. The button becomes pending automatically
	 * until the Action settles. `onPress` handles the interaction. `pressAction` performs the
	 * resulting operation.
	 */
	pressAction?: PressAction;
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: IconButtonRecipeProps['size'];
}

type IconButtonStyleProps =
	| (IconButtonBaseProps & {
			/** Visual prominence. @default 'standard' */
			prominence?: 'low' | 'standard';
			/** Visual tone. @default 'neutral' */
			tone?: 'neutral';
	  })
	| (IconButtonBaseProps & {
			/** Visual prominence. @default 'standard' */
			prominence?: PrimitiveButtonRecipeProps['prominence'];
			/** Visual tone. */
			tone: 'accent';
	  })
	| (IconButtonBaseProps & {
			/** Visual prominence. @default 'standard' */
			prominence?: PrimitiveButtonRecipeProps['prominence'];
			/** Visual tone. */
			tone: 'critical';
	  });

type _IconButtonOmit = DistributiveOmit<
	PrimitiveButtonProps,
	| 'appearance'
	| 'isBlock'
	| 'isPending'
	| 'prominence'
	| 'size'
	| 'tone'
	| keyof DocumentedPressProps
>;

type _IconButtonProps = _IconButtonOmit &
	IconButtonStyleProps &
	DocumentedPressProps & {
		/** Icon name from the generated icon set. */
		icon: IconName;
	};

/** Props for `IconButton`. */
export type IconButtonProps = Prettify<_IconButtonProps>;

/** Button that renders only an icon. */
export function IconButton(props: IconButtonProps): JSX.Element {
	const {
		icon,
		isPending = false,
		onPress,
		pressAction,
		prominence = 'standard',
		size = 'medium',
		tone = 'neutral',
		...buttonProps
	} = props;
	const {
		isPendingState,
		onPress: handlePress,
		showSpinner,
	} = usePressAction({ isPending, onPress, pressAction });

	return (
		<Button
			{...buttonProps}
			appearance="button"
			className={composeRenderProps(props.className, (value) => {
				return cx(iconButtonReset, iconButtonRecipe({ className: value, size }));
			})}
			isPending={isPendingState}
			onPress={handlePress}
			prominence={prominence}
			size={size}
			tone={tone}
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
