import type { ButtonProps as RACButtonProps } from 'react-aria-components';

interface SampleStyleProps {
	/** Controls the button size. @default 'medium' */
	size?: 'small' | 'medium';
	/** Visual tone variant. @default 'primary' */
	tone?: 'primary' | 'critical';
}

/**
 * Sample composed button.
 * @tier composed
 */
export interface SampleProps
	extends Omit<RACButtonProps, keyof SampleStyleProps>, SampleStyleProps {}

/** Sample composed button with size and tone variants. */
export function Sample(_props: SampleProps): null {
	return null;
}
