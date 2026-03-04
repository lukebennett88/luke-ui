import type { JSX } from 'react';
import { LoadingSpinner } from '../../../feedback/loading-spinner/primitives/loading-spinner.js';
import { BUTTON_FONT_SIZE, BUTTON_ICON_SIZE } from '../../../lib/button.js';
import * as styles from '../../../recipes/button-composed.css.js';
import { Text } from '../../../typography/text/primitives/text.js';
import type { ButtonProps } from '../primitives/button.js';
import { Button as PrimitiveButton } from '../primitives/button.js';

export type { ButtonProps };

/** Button with composed label and pending spinner styles. */
export function Button(props: ButtonProps): JSX.Element {
	const { children, isPending, size = 'medium', ...restProps } = props;

	return (
		<PrimitiveButton {...restProps} isPending={isPending} size={size}>
			{(renderProps) => (
				<span className={styles.buttonContent}>
					{isPending && (
						<span className={styles.spinnerOverlay} aria-hidden>
							<LoadingSpinner aria-hidden size={BUTTON_ICON_SIZE[size]} />
						</span>
					)}
					<Text
						className={styles.buttonLabel({ isPending })}
						color="inherit"
						fontSize={BUTTON_FONT_SIZE[size]}
						fontWeight="inherit"
						lineHeight="nospace"
						shouldDisableTrim
						lineClamp={1}
					>
						{typeof children === 'function' ? children(renderProps) : children}
					</Text>
				</span>
			)}
		</PrimitiveButton>
	);
}
