import { vars } from '../theme/contract.css.js';

/**
 * Mixes the mode's opaque interaction ink into a resting fill, for hover and pressed feedback.
 *
 * The result is a plain colour, so callers assign it to `backgroundColor` or `borderColor` and let
 * the existing feedback transition animate it. Two alternatives do not work: a `background-image`
 * gradient cannot be transitioned, because `background-image` does not interpolate; and an inset
 * `box-shadow` is clipped to the padding box, so it never tints the border. Where the resting fill
 * is `transparent` the mix stays translucent, which is the wanted result for a ghost control, and
 * `background-color` still animates.
 */
export function overlayWash(fill: string, percent: number): string {
	return `color-mix(in oklab, ${vars.color.overlay.tint} ${percent}%, ${fill})`;
}
