import type { JSX } from 'react';
import { composeRenderProps } from 'react-aria-components';
import * as styles from '../../../recipes/icon-button.css.js';
import { cx } from '../../../utils.js';
import type { IconName } from '../../../visuals/icon/primitives/icon.js';
import { Icon } from '../../../visuals/icon/primitives/icon.js';
import type { ButtonProps } from '../primitives/button.js';
import { Button } from '../primitives/button.js';

/** Props for `IconButton`. */
export interface IconButtonProps extends ButtonProps {
	/** Icon name from the generated icon set. */
	icon: IconName;
}

/** Button that renders only an icon. */
export function IconButton(props: IconButtonProps): JSX.Element {
	const { icon, size = 'medium', ...buttonProps } = props;

	return (
		<Button
			{...buttonProps}
			className={composeRenderProps(props.className, (value) => {
				return cx(
					styles.iconButton({
						size,
					}),
					value,
				);
			})}
			size={size}
		>
			<Icon name={icon} aria-hidden />
		</Button>
	);
}
