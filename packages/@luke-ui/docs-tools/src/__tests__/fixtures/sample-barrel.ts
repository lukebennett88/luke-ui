/**
 * Sample barrel that re-exports multiple named components.
 */

/** Allowed size values. */
export type SampleWidgetSize = 'small' | 'medium' | 'large';

/** A sample widget component. */
export function SampleWidget(_props: { size?: SampleWidgetSize }): null {
	return null;
}

/** A sample panel component. */
export function SamplePanel(_props: { label: string }): null {
	return null;
}
