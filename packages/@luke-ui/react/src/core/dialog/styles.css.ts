import { vars } from '../../theme/contract.css.js';
import { style } from '../styles/layered-style.css.js';

// The close button is taller than the title's cap height, so in the Lockup row it would push the
// title down and widen the gap below it. Negative block margins shrink the rail's margin box to
// `1cap`, so the title sits where it does without a close button and the button overhangs the
// padding. The same margin at the inline end puts the button the same distance from the top and
// end edges.
const closeButtonOverhang = `calc((1cap - ${vars.controlSize['32']}) / 2)`;

export const dialogCloseButtonRail = style({
	marginBlock: closeButtonOverhang,
	marginInlineEnd: closeButtonOverhang,
});
