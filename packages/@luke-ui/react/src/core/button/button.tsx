import type { JSX, ReactNode } from 'react';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.js';
import type { ButtonProps as PrimitiveButtonProps } from '../primitives/button/button.js';
import { Button as PrimitiveButton } from '../primitives/button/button.js';
import type * as primitiveStyles from '../primitives/button/recipe.css.js';
import { pendingSpinnerOverlay } from '../styles/pending-spinner-overlay.css.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import type { PressAction } from '../use-press-action/use-press-action.js';
import { PressActionError, usePressAction } from '../use-press-action/use-press-action.js';
import type { ButtonLabelVariants } from './styles.css.js';
import { buttonContent, buttonLabel } from './styles.css.js';

interface ButtonLabelRecipeProps extends NonNullable<ButtonLabelVariants> {}

interface PrimitiveButtonRecipeProps extends NonNullable<primitiveStyles.ButtonRecipeVariants> {}

interface ButtonStyleProps {
	/**
	 * Visual emphasis.
	 * @default 'solid'
	 */
	appearance?: PrimitiveButtonRecipeProps['appearance'];
	/**
	 * Non-interactive adornment shown after the label, such as an icon, badge, count, or keyboard
	 * hint. Nested interactive controls are unsupported.
	 */
	endContent?: ReactNode;
	/**
	 * Whether the button takes up the full inline size of its container.
	 * @default false
	 */
	isBlock?: PrimitiveButtonRecipeProps['isBlock'];
	/**
	 * Externally owned pending state. When true, the button is non-interactive and shows a spinner
	 * immediately. Prefer `pressAction` for Button-owned async work.
	 * @default false
	 */
	isPending?: ButtonLabelRecipeProps['isPending'];
	/**
	 * Button-owned async work run as a React Action. The button becomes pending automatically until
	 * the Action settles. Use `onPress` for the synchronous interaction; use `pressAction` for the
	 * resulting operation. Prefer a native `<form action>` when the work is a form submission.
	 */
	pressAction?: PressAction;
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: PrimitiveButtonRecipeProps['size'];
	/**
	 * Non-interactive adornment shown before the label, such as an icon. Nested interactive controls
	 * are unsupported.
	 */
	startContent?: ReactNode;
	/**
	 * Visual tone. Controls colour scheme.
	 * @default 'neutral'
	 */
	tone?: PrimitiveButtonRecipeProps['tone'];
}

type _ButtonOmit = DistributiveOmit<
	PrimitiveButtonProps,
	'appearance' | 'isBlock' | 'isPending' | 'size' | 'tone' | keyof DocumentedPressProps
>;

interface _ButtonProps extends _ButtonOmit, ButtonStyleProps, DocumentedPressProps {}

/** Props for `Button`. */
export type ButtonProps = Prettify<_ButtonProps>;

/**
 * Button with size, tone, appearance, pending, and block options.
 * Wraps children in a `Text` for ellipsis truncation. Shows a spinner when pending.
 */
export function Button(props: ButtonProps): JSX.Element {
	const {
		children,
		endContent,
		isPending = false,
		onPress,
		pressAction,
		size = 'medium',
		startContent,
		...restProps
	} = props;
	const {
		actionError,
		isPendingState,
		onPress: handlePress,
		showSpinner,
	} = usePressAction({ isPending, onPress, pressAction });

	return (
		<PrimitiveButton {...restProps} isPending={isPendingState} onPress={handlePress} size={size}>
			{(renderProps) => (
				<span className={buttonContent()}>
					<PressActionError error={actionError} />
					{showSpinner && (
						<span aria-hidden className={pendingSpinnerOverlay()}>
							<LoadingSpinner aria-hidden />
						</span>
					)}
					<span className={buttonLabel({ isPending: showSpinner })}>
						{startContent}
						<Text elementType="span" lineClamp shouldInheritFont>
							{typeof children === 'function' ? children(renderProps) : children}
						</Text>
						{endContent}
					</span>
				</span>
			)}
		</PrimitiveButton>
	);
}
