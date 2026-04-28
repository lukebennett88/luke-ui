import fontMetrics from '@capsizecss/metrics/appleSystem';
import { createTextStyle } from '@capsizecss/vanilla-extract';
import type { FontSizeToken, LineHeightToken } from '../tokens/index.js';
import { dimensionToPxNumber, tokens } from '../tokens/index.js';

interface GetTypographyInput {
	fontSize: FontSizeToken;
	lineHeight: LineHeightToken;
}

export function getTypographyClass(input: GetTypographyInput, debugId?: string) {
	const fontSize = dimensionToPxNumber(tokens.fontSize[input.fontSize].$value);
	const lineHeight = tokens.lineHeight[input.lineHeight].$value;

	return createTextStyle(
		{
			fontMetrics,
			fontSize,
			leading: fontSize * lineHeight,
		},
		debugId,
	);
}
