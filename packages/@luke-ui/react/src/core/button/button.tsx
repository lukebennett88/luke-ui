import type { JSX, ReactNode } from 'react';
import type { ButtonPresentationProps } from '../action-presentation.js';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.js';
import type { ButtonProps as PrimitiveButtonProps } from '../primitives/button/button.js';
import { Button as PrimitiveButton } from '../primitives/button/button.js';
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

type ButtonContentProps =
	| {
			appearance?: 'button';
			/** Non-interactive adornment shown after the label. */
			endContent?: ReactNode;
			/** Non-interactive adornment shown before the label. */
			startContent?: ReactNode;
	  }
	| {
			appearance: 'text';
			endContent?: never;
			startContent?: never;
	  };

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
export type ButtonProps = Prettify<_ButtonProps & ButtonPresentationProps & ButtonContentProps>;

/**
 * Button with appearance, tone, prominence, size, pending, and block options.
 * Wraps children in a `Text` for ellipsis truncation. Shows a spinner when pending.
 */
export function Button(props: ButtonProps): JSX.Element {
	const {
		appearance = 'button',
		children,
		endContent,
		isBlock: _isBlock,
		isPending = false,
		onPress,
		pressAction,
		prominence: _prominence,
		size: _size,
		startContent,
		tone: _tone,
		...restProps
	} = props;
	const presentationProps = getPrimitivePresentationProps(props);
	const {
		isPendingState,
		onPress: handlePress,
		showSpinner,
	} = usePressAction({ isPending, onPress, pressAction });

	if (appearance === 'text') {
		return (
			<PrimitiveButton
				{...restProps}
				{...presentationProps}
				isPending={isPendingState}
				onPress={handlePress}
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
			{...presentationProps}
			isPending={isPendingState}
			onPress={handlePress}
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

function getPrimitivePresentationProps(props: ButtonPresentationProps): ButtonPresentationProps {
	if (props.appearance === 'text') {
		if (props.tone === 'critical') {
			return {
				appearance: 'text',
				prominence: props.prominence,
				tone: 'critical',
			};
		}

		return {
			appearance: 'text',
			prominence: props.prominence,
			tone: 'neutral',
		};
	}

	return {
		appearance: 'button',
		isBlock: props.isBlock,
		prominence: props.prominence,
		size: props.size,
		tone: props.tone,
	};
}
