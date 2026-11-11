// Stand-in themes: the public `--luke-space-*` and `--luke-radius-*` names with two radius scales,
// so a theme switch can be asserted without the colour pipeline.
import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../../../../packages/@luke-ui/react/src/theme/contract.css.js';

const space = Object.fromEntries(
	Object.entries(vars.space).map(([step, name]) => [name, `${Number(step) / 16}rem`]),
);
const radius = (control: number, detail: number, overlay: number, surface: number) => ({
	[vars.radius.control]: `${control / 16}rem`,
	[vars.radius.detail]: `${detail / 16}rem`,
	[vars.radius.full]: '9999px',
	[vars.radius.overlay]: `${overlay / 16}rem`,
	[vars.radius.surface]: `${surface / 16}rem`,
});

globalStyle(':root', { containerType: 'inline-size', vars: { ...space, ...radius(8, 4, 16, 12) } });
globalStyle(':root.theme-round', { vars: radius(16, 8, 32, 24) });
globalStyle(':root.theme-square', { vars: radius(0, 0, 0, 0) });
globalStyle('*', { boxSizing: 'border-box' });
globalStyle('body', { fontFamily: 'system-ui, sans-serif', fontSize: '13px', margin: 0 });
