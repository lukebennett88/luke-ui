import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { cx } from '@luke-ui/react/utils';
import { useState } from 'react';
import { CodeBlock } from './code-block/code-block.js';
import * as styles from './example-code-preview.css.js';

export function ExampleCodePreview({
	html,
	source,
	title,
}: {
	html: string;
	source: string;
	title: string;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	// Lines never wrap, so the line count says whether the preview clips.
	const canExpand = source.split('\n').length > styles.collapsedLineCount;

	return (
		<Box
			backgroundColor="surface.subdued"
			overflow="hidden"
			paddingBlockEnd={canExpand ? 'space.48' : undefined}
			position="relative"
		>
			{/* Shiki escapes the source before the Vite plugin generates this HTML. */}
			<CodeBlock
				className={canExpand ? cx(styles.collapsible, isExpanded && styles.expanded) : undefined}
				copyText={source}
				flush
				html={html}
				viewportLabel={`${title} code`}
			/>
			{canExpand ? (
				<Box
					display="flex"
					insetBlockEnd="space.8"
					insetInlineStart="50%"
					justifyContent="center"
					position="absolute"
					style={{
						transform: 'translateX(-50%)',
						zIndex: 1,
					}}
				>
					<Button
						aria-expanded={isExpanded}
						onPress={() => setIsExpanded((prev) => !prev)}
						size="small"
					>
						{isExpanded ? 'Collapse code' : 'Expand code'}
					</Button>
				</Box>
			) : null}
		</Box>
	);
}
