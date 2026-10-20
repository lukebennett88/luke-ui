import type { JSX, ReactNode } from 'react';
import { cx } from '../../shared/utils/utils.js';
import type { ButtonPresentationProps } from '../action-presentation.js';
import { PendingSpinner } from '../pending-spinner/pending-spinner.js';
import { pendingContent } from '../pending-spinner/styles.css.js';
import type { ButtonProps as PrimitiveButtonProps } from '../primitives/button/button.js';
import { Button as PrimitiveButton } from '../primitives/button/button.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import type { PressAction } from '../use-press-action/use-press-action.js';
import { usePressAction } from '../use-press-action/use-press-action.js';
import { buttonContent, buttonLabel } from './styles.css.js';

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
	| 'inlineSize'
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
		isPending?: boolean;
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
 * Button with appearance, tone, prominence, size, pending, and inline-size options.
 * Button appearance truncates its label. Text appearance wraps with surrounding text. Shows a
 * spinner when pending.
 */
export function Button(props: ButtonProps): JSX.Element {
	const {
		appearance = 'button',
		children,
		endContent,
		inlineSize: _inlineSize,
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
					<>
						{showSpinner && <PendingSpinner />}
						<Text
							className={pendingContent({ isPending: showSpinner })}
							elementType="span"
							shouldInheritFont
							textDecoration="inherit"
						>
							{typeof children === 'function' ? children(renderProps) : children}
						</Text>
					</>
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
				<span className={buttonContent()}>
					{showSpinner && <PendingSpinner />}
					<span
						className={cx(
							pendingContent({ isPending: showSpinner }),
							buttonLabel({ hasAdornments: true }),
						)}
					>
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
		inlineSize: props.inlineSize,
		prominence: props.prominence,
		size: props.size,
		tone: props.tone,
	};
}
