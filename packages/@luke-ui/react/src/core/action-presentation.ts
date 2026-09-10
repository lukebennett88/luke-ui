/** Visual hierarchy shared by action and navigation controls. */
type Prominence = 'low' | 'standard' | 'high';

/** Visual presentation props accepted by Button and its public recipe. */
export type ButtonPresentationProps =
	| {
			appearance?: 'button';
			isBlock?: boolean;
			prominence?: Prominence;
			size?: 'small' | 'medium';
			tone?: 'neutral' | 'critical';
	  }
	| {
			appearance: 'text';
			isBlock?: never;
			prominence?: Prominence;
			size?: never;
			tone?: 'neutral';
	  }
	| {
			appearance: 'text';
			isBlock?: never;
			prominence?: 'low' | 'standard';
			size?: never;
			tone: 'critical';
	  };

/** Visual presentation props accepted by Link and its public recipe. */
export type LinkPresentationProps =
	| {
			appearance?: 'text';
			isBlock?: never;
			prominence?: Prominence;
			size?: never;
	  }
	| {
			appearance: 'button';
			isBlock?: boolean;
			prominence?: Prominence;
			size?: 'small' | 'medium';
	  };

/** Visual presentation props accepted by IconButton. */
export interface IconButtonPresentationProps {
	prominence?: Prominence;
	size?: 'small' | 'medium';
	tone?: 'neutral' | 'critical';
}

/** Visual presentation props accepted by IconLink. */
export interface IconLinkPresentationProps {
	prominence?: Prominence;
	size?: 'small' | 'medium';
}
