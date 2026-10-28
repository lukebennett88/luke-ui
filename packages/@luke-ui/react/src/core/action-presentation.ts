/** Strength of a control's visual treatment. */
type Prominence = 'low' | 'standard' | 'high';

/** Visual presentation props accepted by Button and its public recipe. */
export type ButtonPresentationProps =
	| {
			/**
			 * Sets whether the control uses button or text-link styling.
			 * @default button
			 */
			appearance?: 'button';
			/**
			 * Use `full` to fill the available inline size.
			 * @default auto
			 */
			inlineSize?: 'auto' | 'full';
			/**
			 * Controls the strength of the control's visual treatment, from low to high.
			 * @default standard
			 */
			prominence?: Prominence;
			/**
			 * Sets the size of the control.
			 * @default medium
			 */
			size?: 'small' | 'medium';
			/**
			 * Sets the visual tone. Use `danger` for destructive actions.
			 * @default neutral
			 */
			tone?: 'neutral' | 'danger';
	  }
	| {
			/**
			 * Sets whether the control uses button or text-link styling.
			 * @default button
			 */
			appearance: 'text';
			inlineSize?: never;
			/**
			 * Controls the strength of the control's visual treatment, from low to high.
			 * @default standard
			 */
			prominence?: Prominence;
			size?: never;
			/**
			 * Sets the visual tone. Use `danger` for destructive actions.
			 * @default neutral
			 */
			tone?: 'neutral';
	  }
	| {
			/**
			 * Sets whether the control uses button or text-link styling.
			 * @default button
			 */
			appearance: 'text';
			inlineSize?: never;
			/**
			 * Controls the strength of the control's visual treatment, from low to high.
			 * @default standard
			 */
			prominence?: 'low' | 'standard';
			size?: never;
			/**
			 * Sets the visual tone. Use `danger` for destructive actions.
			 * @default neutral
			 */
			tone: 'danger';
	  };

/** Visual presentation props accepted by Link and its public recipe. */
export type LinkPresentationProps =
	| {
			/**
			 * Sets whether the control uses button or text-link styling.
			 * @default text
			 */
			appearance?: 'text';
			inlineSize?: never;
			/**
			 * Controls the strength of the control's visual treatment, from low to high.
			 * @default standard
			 */
			prominence?: Prominence;
			size?: never;
	  }
	| {
			/**
			 * Sets whether the control uses button or text-link styling.
			 * @default text
			 */
			appearance: 'button';
			/**
			 * Use `full` to fill the available inline size.
			 * @default auto
			 */
			inlineSize?: 'auto' | 'full';
			/**
			 * Controls the strength of the control's visual treatment, from low to high.
			 * @default standard
			 */
			prominence?: Prominence;
			/**
			 * Sets the size of the control.
			 * @default medium
			 */
			size?: 'small' | 'medium';
	  };

/** Visual presentation props accepted by IconButton. */
export interface IconButtonPresentationProps {
	/**
	 * Controls the strength of the control's visual treatment, from low to high.
	 * @default standard
	 */
	prominence?: Prominence;
	/**
	 * Sets the size of the control.
	 * @default medium
	 */
	size?: 'small' | 'medium';
	/**
	 * Sets the visual tone. Use `danger` for destructive actions.
	 * @default neutral
	 */
	tone?: 'neutral' | 'danger';
}

/** Visual presentation props accepted by IconLink. */
export interface IconLinkPresentationProps {
	/**
	 * Controls the strength of the control's visual treatment, from low to high.
	 * @default standard
	 */
	prominence?: Prominence;
	/**
	 * Sets the size of the control.
	 * @default medium
	 */
	size?: 'small' | 'medium';
}
