import { vars } from '../../theme/contract.css.js';
import { globalStyleInLayer } from '../styles/layered-style.css.js';
import { proseScopeClassName } from './scope.js';

function proseStyle(selector: string, rule: Parameters<typeof globalStyleInLayer>[2]) {
	globalStyleInLayer('structural', `:where(.${proseScopeClassName}) :where(${selector})`, rule);
}

// Each gap is the following block's start margin. No block-end margin can collapse or escape.
proseStyle(
	'p, h1, h2, h3, h4, h5, h6, ul, ol, li, dl, dt, dd, blockquote, pre, hr, figure, figcaption, table, img, picture, video',
	{ marginBlock: 0 },
);
proseStyle('* + p, * + ul, * + ol, * + dl, * + h1', { marginBlockStart: vars.space.sp24 });
proseStyle('* + h2, * + hr', { marginBlockStart: vars.space.sp48 });
proseStyle('* + h3, * + blockquote, * + table, * + figure, * + img, * + picture, * + video', {
	marginBlockStart: vars.space.sp32,
});
proseStyle('* + h4, * + h5, * + h6, * + pre', { marginBlockStart: vars.space.sp24 });
proseStyle('* + li, * + dd', { marginBlockStart: vars.space.sp8 });
proseStyle('* + dt', { marginBlockStart: vars.space.sp24 });
proseStyle('* + figcaption, li > ul, li > ol, li > p + p', {
	marginBlockStart: vars.space.sp12,
});

proseStyle('h1 + *', { marginBlockStart: vars.space.sp32 });
proseStyle('h1 + h2, h1 + hr', { marginBlockStart: vars.space.sp48 });
proseStyle('h2 + *', { marginBlockStart: vars.space.sp24 });
proseStyle('h3 + *', { marginBlockStart: vars.space.sp16 });
proseStyle('h4 + *, h5 + *, h6 + *', { marginBlockStart: vars.space.sp12 });
// A rule is a section break on both sides.
proseStyle('hr + *', { marginBlockStart: vars.space.sp48 });

proseStyle('img, picture, video', { display: 'block' });
proseStyle('figure > img, figure > picture, figure > video, picture > img', {
	marginBlockStart: 0,
});

proseStyle('ul', { listStyleType: 'disc', paddingInlineStart: vars.space.sp24 });
// Untyped ols restore decimal. Typed ols omit list-style-type so HTML presentational hints apply
// inside Prose; the reset leaves those ols alone via `proseScopeClassName` from `./scope.js`.
proseStyle('ol:not([type])', { listStyleType: 'decimal', paddingInlineStart: vars.space.sp24 });
proseStyle('ol[type]', { paddingInlineStart: vars.space.sp24 });

proseStyle('hr', {
	blockSize: 0,
	border: 'none',
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
});
// Table cells need padding after the reset removes it.
proseStyle('th, td', { paddingBlock: vars.space.sp8, paddingInline: vars.space.sp12 });
proseStyle('th', { textAlign: 'start' });
proseStyle('thead th', { borderBlockEnd: `1px solid ${vars.color.border.decorative}` });
