import type { JSX } from 'react';
import type { IconButtonProps } from './icon-button.js';
import { IconButton } from './icon-button.js';

export interface CloseButtonProps extends Omit<IconButtonProps, 'children' | 'icon'> {}

export function CloseButton(props: CloseButtonProps): JSX.Element {
	const { tone = 'ghost', ...iconButtonProps } = props;

	return <IconButton {...iconButtonProps} aria-label="Close" icon="close" tone={tone} />;
}
