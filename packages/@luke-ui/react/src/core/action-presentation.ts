/** Visual hierarchy shared by action and navigation controls. */
type Prominence = 'low' | 'standard' | 'high';

/** Visual presentation props accepted by Button and its public recipe. */
export type ButtonPresentationProps =
	| {
			/**
			 * Visual emphasis.
			 * @default button
			 */
			appearance?: 'button';
			/**
			 * Whether the control takes up the full inline size of its container.
			 * @default false
			 */
			isBlock?: boolean;
			/**
			 * Visual hierarchy relative to nearby actions.
			 * @default standard
			 */
			prominence?: Prominence;
			/**
			 * Control size.
			 * @default medium
			 */
			size?: 'small' | 'medium';
			/**
			 * Visual tone. Controls colour scheme.
			 * @default neutral
			 */
			tone?: 'neutral' | 'critical';
	  }
	| {
			/**
			 * Visual emphasis.
			 * @default button
			 */
			appearance: 'text';
			isBlock?: never;
			/**
			 * Visual hierarchy relative to nearby actions.
			 * @default standard
			 */
			prominence?: Prominence;
			size?: never;
			/**
			 * Visual tone. Controls colour scheme.
			 * @default neutral
			 */
			tone?: 'neutral';
	  }
	| {
			/**
			 * Visual emphasis.
			 * @default button
			 */
			appearance: 'text';
			isBlock?: never;
			/**
			 * Visual hierarchy relative to nearby actions.
			 * @default standard
			 */
			prominence?: 'low' | 'standard';
			size?: never;
			/**
			 * Visual tone. Controls colour scheme.
			 * @default neutral
			 */
			tone: 'critical';
	  };

/** Visual presentation props accepted by Link and its public recipe. */
export type LinkPresentationProps =
	| {
			/**
			 * Visual emphasis.
			 * @default text
			 */
			appearance?: 'text';
			isBlock?: never;
			/**
			 * Visual hierarchy relative to nearby actions.
			 * @default standard
			 */
			prominence?: Prominence;
			size?: never;
	  }
	| {
			/**
			 * Visual emphasis.
			 * @default text
			 */
			appearance: 'button';
			/**
			 * Whether the control takes up the full inline size of its container.
			 * @default false
			 */
			isBlock?: boolean;
			/**
			 * Visual hierarchy relative to nearby actions.
			 * @default standard
			 */
			prominence?: Prominence;
			/**
			 * Control size.
			 * @default medium
			 */
			size?: 'small' | 'medium';
	  };

/** Visual presentation props accepted by IconButton. */
export interface IconButtonPresentationProps {
	/**
	 * Visual hierarchy relative to nearby actions.
	 * @default standard
	 */
	prominence?: Prominence;
	/**
	 * Control size.
	 * @default medium
	 */
	size?: 'small' | 'medium';
	/**
	 * Visual tone. Controls colour scheme.
	 * @default neutral
	 */
	tone?: 'neutral' | 'critical';
}

/** Visual presentation props accepted by IconLink. */
export interface IconLinkPresentationProps {
	/**
	 * Visual hierarchy relative to nearby actions.
	 * @default standard
	 */
	prominence?: Prominence;
	/**
	 * Control size.
	 * @default medium
	 */
	size?: 'small' | 'medium';
}
