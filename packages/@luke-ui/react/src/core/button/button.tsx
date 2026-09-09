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
import { usePressAction } from '../use-press-action/use-press-action.js';
import type { ButtonLabelVariants } from './styles.css.js';
import { buttonContent, buttonLabel } from './styles.css.js';

interface ButtonLabelRecipeProps extends NonNullable<ButtonLabelVariants> {}

interface PrimitiveButtonRecipeProps extends NonNullable<primitiveStyles.ButtonRecipeVariants> {}

interface ButtonControlBaseProps {
	/**
	 * Chooses the button-shaped presentation.
	 * @default 'button'
	 */
	appearance?: 'button';
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
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: PrimitiveButtonRecipeProps['size'];
	/**
	 * Non-interactive adornment shown before the label, such as an icon. Nested interactive controls
	 * are unsupported.
	 */
	startContent?: ReactNode;
}

type ButtonControlProps =
	| (ButtonControlBaseProps & {
			/** Visual prominence. @default 'standard' */
			prominence?: 'low' | 'standard';
			/** Visual tone. @default 'neutral' */
			tone?: 'neutral';
	  })
	| (ButtonControlBaseProps & {
			/** Visual prominence. @default 'standard' */
			prominence?: PrimitiveButtonRecipeProps['prominence'];
			/** Visual tone. */
			tone: 'accent';
	  })
	| (ButtonControlBaseProps & {
			/** Visual prominence. @default 'standard' */
			prominence?: PrimitiveButtonRecipeProps['prominence'];
			/** Visual tone. */
			tone: 'critical';
	  });

interface ButtonTextBaseProps {
	/** Renders the Button with text-link presentation. */
	appearance: 'text';
	/** Text Buttons do not use control sizing. */
	size?: never;
	/** Text Buttons do not fill their container. */
	isBlock?: never;
	/** Text Buttons do not support start content. */
	startContent?: never;
	/** Text Buttons do not support end content. */
	endContent?: never;
}

type ButtonTextProps =
	| (ButtonTextBaseProps & {
			/** Visual prominence. @default 'standard' */
			prominence?: 'low' | 'standard';
			/** Visual tone. @default 'neutral' */
			tone?: 'neutral';
	  })
	| (ButtonTextBaseProps & {
			/** Visual prominence. @default 'standard' */
			prominence?: 'standard' | 'high';
			/** Visual tone. */
			tone: 'accent';
	  })
	| (ButtonTextBaseProps & {
			/** Visual prominence. @default 'standard' */
			prominence?: 'low' | 'standard';
			/** Visual tone. */
			tone: 'critical';
	  });

type _ButtonOmit = DistributiveOmit<
	PrimitiveButtonProps,
	| 'appearance'
	| 'isBlock'
	| 'isPending'
	| 'prominence'
	| 'size'
	| 'tone'
	| keyof DocumentedPressProps
>;

type _ButtonProps = _ButtonOmit &
	DocumentedPressProps & {
		/**
		 * Externally owned pending state. When true, the button is non-interactive and shows a spinner
		 * immediately. Prefer `pressAction` for Button-owned operations.
		 * @default false
		 */
		isPending?: ButtonLabelRecipeProps['isPending'];
		/**
		 * Button-owned operation run as a React Action. The button becomes pending automatically until
		 * the Action settles. `onPress` handles the interaction. `pressAction` performs the resulting
		 * operation. Prefer a native `<form action>` when the operation is a form submission.
		 */
		pressAction?: PressAction;
	};

/** Props for `Button`. */
export type ButtonProps = Prettify<_ButtonProps & (ButtonControlProps | ButtonTextProps)>;

/**
 * Button with size, tone, appearance, pending, and block options.
 * Wraps children in a `Text` for ellipsis truncation. Shows a spinner when pending.
 */
export function Button(props: ButtonProps): JSX.Element {
	const {
		appearance = 'button',
		children,
		endContent,
		isPending = false,
		isBlock,
		onPress,
		pressAction,
		prominence = 'standard',
		size,
		startContent,
		tone = 'neutral',
		...restProps
	} = props;
	const {
		isPendingState,
		onPress: handlePress,
		showSpinner,
	} = usePressAction({ isPending, onPress, pressAction });

	if (appearance === 'text') {
		return (
			<PrimitiveButton
				{...restProps}
				appearance="text"
				isPending={isPendingState}
				onPress={handlePress}
				prominence={prominence}
				tone={tone}
			>
				{(renderProps) => (
					<span className={buttonContent({ appearance: 'text' })}>
						{showSpinner && (
							<span aria-hidden className={pendingSpinnerOverlay()}>
								<LoadingSpinner aria-hidden />
							</span>
						)}
						<span className={buttonLabel({ appearance: 'text', isPending: showSpinner })}>
							{typeof children === 'function' ? children(renderProps) : children}
						</span>
					</span>
				)}
			</PrimitiveButton>
		);
	}

	return (
		<PrimitiveButton
			{...restProps}
			isBlock={isBlock}
			isPending={isPendingState}
			onPress={handlePress}
			prominence={prominence}
			size={size}
			tone={tone}
		>
			{(renderProps) => (
				<span className={buttonContent({ appearance: 'button' })}>
					{showSpinner && (
						<span aria-hidden className={pendingSpinnerOverlay()}>
							<LoadingSpinner aria-hidden />
						</span>
					)}
					<span className={buttonLabel({ appearance: 'button', isPending: showSpinner })}>
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
