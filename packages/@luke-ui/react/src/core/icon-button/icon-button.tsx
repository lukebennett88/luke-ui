import type { JSX, ReactElement } from 'react';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../shared/utils/utils.js';
import type { IconButtonPresentationProps } from '../action-presentation.js';
import type { IconName } from '../icon/icon.js';
import { Icon } from '../icon/icon.js';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.js';
import type { ButtonProps as PrimitiveButtonProps } from '../primitives/button/button.js';
import { Button } from '../primitives/button/button.js';
import { pendingSpinnerOverlay } from '../styles/pending-spinner-overlay.css.js';
import type { RequiredAccessibleName } from '../types/accessible-name.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import type { PressAction } from '../use-press-action/use-press-action.js';
import { usePressAction } from '../use-press-action/use-press-action.js';
import { iconButtonIcon, iconButtonRecipe, iconButtonReset } from './recipe.css.js';
import { iconOnlyIconWrapper } from './styles.css.js';

interface IconButtonBaseProps extends IconButtonPresentationProps {
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
	/** Icon name from the generated icon set, or a custom icon element such as a brand mark. */
	icon: IconName | ReactElement;
}

type _IconButtonOmit = DistributiveOmit<
	PrimitiveButtonProps,
	| 'appearance'
	| 'aria-label'
	| 'aria-labelledby'
	| 'children'
	| 'isBlock'
	| 'isPending'
	| 'prominence'
	| 'size'
	| 'tone'
	| keyof DocumentedPressProps
>;

type _IconButtonProps = _IconButtonOmit &
	IconButtonBaseProps &
	DocumentedPressProps &
	RequiredAccessibleName;

/** Props for `IconButton`. */
export type IconButtonProps = Prettify<_IconButtonProps>;

/** Button that renders only an icon. */
export function IconButton(props: IconButtonProps): JSX.Element {
	const {
		tone = 'neutral',
		prominence = 'standard',
		icon,
		isPending = false,
		onPress,
		pressAction,
		size = 'medium',
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
			tone={tone}
			prominence={prominence}
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
			<span
				aria-hidden
				className={cx(iconOnlyIconWrapper, iconButtonIcon({ isPending: showSpinner }))}
			>
				{typeof icon === 'string' ? <Icon name={icon} /> : icon}
			</span>
		</Button>
	);
}
