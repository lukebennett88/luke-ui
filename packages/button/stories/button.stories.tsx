import type { Story } from '@ladle/react';

import type { ButtonProps } from '../src';
import { Button } from '../src';

export const Controls: Story<ButtonProps> = (props) => {
	return <Button {...props} />;
};

Controls.args = {
	children: 'Hello world',
	disabled: false,
} as ButtonProps;
