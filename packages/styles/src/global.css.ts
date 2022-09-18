/**
 * This file allows us to set up our global styles. If we also
 * wanted to apply a CSS reset, this is where we'd define it.
 *
 * More detail: https://vanilla-extract.style/documentation/global-api/global-style
 */
import { globalStyle } from '@vanilla-extract/css';

// /**
//  * Remove all the styles of the "User-Agent-Stylesheet",
//  * except for the 'display' property
//  * */
// globalStyle('*:where(:not(iframe, canvas, img, svg, video):not(svg *))', {
// 	all: 'unset',
// 	display: 'revert',
// });

// /** Preferred box-sizing value */
// globalStyle('*, *::before, *::after', {
// 	boxSizing: 'border-box',
// });

/** Preferred box-sizing value */
globalStyle('body', {
	margin: 0,
	padding: 0,
});

/** Remove list styles (bullets/numbers) */
globalStyle('ol, ul', {
	listStyle: 'none',
});

/** For images to not be able to exceed their container */
globalStyle('img', {
	maxWidth: '100%',
});

/** Removes spacing between cells in tables */
globalStyle('table', {
	borderCollapse: 'collapse',
});
