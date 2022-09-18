import type { FontMetrics } from '@capsizecss/core';
import { getCapHeight, precomputeValues } from '@capsizecss/core';
import { mapValues } from 'remeda';

import type {
	ResponsiveTextDefinition,
	TextDefinition,
} from './tokens/typography';
import { pxToRem } from './utils/px-to-rem';

/**
 * Calculate leading and trim styles using
 * [Capsize](https://seek-oss.github.io/capsize/) to ensure vertical spacing
 * around text elements behaves as expected.
 */
function fontSizeToCapHeight(
	definition: TextDefinition,
	fontMetrics: FontMetrics
) {
	const rowHeight = 4;
	const capHeight = getCapHeight({
		fontSize: definition.fontSize,
		fontMetrics,
	});

	const { fontSize, lineHeight, ...trims } = precomputeValues({
		fontSize: definition.fontSize,
		leading: definition.rows * rowHeight,
		fontMetrics,
	});

	return {
		fontSize: pxToRem(fontSize),
		lineHeight: pxToRem(lineHeight),
		capHeight: pxToRem(capHeight),
		trims,
	};
}

function responsiveTypography(
	definition: ResponsiveTextDefinition,
	fontMetrics: FontMetrics
) {
	const { none, medium } = definition;

	return {
		none: fontSizeToCapHeight(none, fontMetrics),
		medium: fontSizeToCapHeight(medium, fontMetrics),
	};
}
