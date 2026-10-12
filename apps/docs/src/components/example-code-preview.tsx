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
	// Source lines never wrap, so the line count decides whether the collapsed preview clips.
	const canExpand = source.split('\n').length > styles.collapsedLineCount;

	return (
		<Box
			backgroundColor="surface.subdued"
			overflow="hidden"
			paddingBlockEnd={canExpand ? 'sp48' : undefined}
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
					insetBlockEnd="sp8"
					insetInlineStart="50%"
					justifyContent="center"
					position="absolute"
					style={{
						transform: 'translateX(-50%)',
						zIndex: 1,
					}}
				>
					<Button onPress={() => setIsExpanded(!isExpanded)} size="small">
						{isExpanded ? 'Collapse code' : 'Expand code'}
					</Button>
				</Box>
			) : null}
		</Box>
	);
}
