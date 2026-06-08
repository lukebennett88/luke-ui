interface InnerProps {
	/** Hidden implementation prop. */
	icon: string;
	/** Inner press handler. */
	onPress?: () => void;
	/** Inner size. @default 'inner' */
	size?: 'small' | 'medium';
}

interface WrapperStyleProps {
	/** Wrapper size. @default 'wrapper' */
	size?: InnerProps['size'];
}

interface WrapperRedeclaredProps {
	/** Wrapper press handler. */
	onPress?: InnerProps['onPress'];
}

/**
 * Props for `Wrapper`.
 * @tier composed
 */
export interface WrapperProps
	extends
		Omit<InnerProps, 'icon' | keyof WrapperStyleProps | keyof WrapperRedeclaredProps>,
		WrapperStyleProps,
		WrapperRedeclaredProps {}

interface WrapperProviderProps {
	/** Provider value. */
	value: string;
}

/** Sample provider component. */
export function WrapperProvider(_props: WrapperProviderProps): null {
	return null;
}

/** Sample wrapper component. */
export function Wrapper(_props: WrapperProps): null {
	return null;
}
