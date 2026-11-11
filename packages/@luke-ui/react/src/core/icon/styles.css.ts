import { iconMaskUrls } from '../../../.generated/icon-mask-data.js';
import { typedEntries } from '../../shared/utils/utils.js';
import { classSelector } from '../styles/class-selector.js';
import { globalStyleInLayer, style } from '../styles/layered-style.css.js';
import { iconMaskStyle } from './mask-style.js';

/** Paints a built-in icon. `data-icon` selects the shape. */
export const iconMask = style(iconMaskStyle());

for (const [name, url] of typedEntries(iconMaskUrls)) {
	globalStyleInLayer('recipes', `${classSelector(iconMask)}[data-icon="${name}"]`, {
		maskImage: url,
	});
}
