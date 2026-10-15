import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { ThemeToken } from '../generated/token-reference.generated.js';
import type { TokenSections } from '../lib/token-grammar.js';
import { tokenSections } from '../lib/token-grammar.js';
import { TokenGroup, TokenPanel, TokenRow } from './token-reference-parts.js';

type NeutralColorGroupId = TokenSections['neutralColors'][number]['id'];

/**
 * The neutral colours in one panel: surfaces, text, structural borders, and the rest. Each sample
 * shows the colour the way components use it.
 */
export function NeutralColors() {
	return (
		<TokenPanel>
			{tokenSections.neutralColors.map((group) => (
				<TokenGroup key={group.id} label={group.title}>
					{group.tokens.map((token) => (
						<TokenRow
							key={token.path}
							sample={<NeutralSample groupId={group.id} token={token} />}
							sampleInlineSize="3.5rem"
							token={token}
						/>
					))}
				</TokenGroup>
			))}
		</TokenPanel>
	);
}

/** Every sample has the same footprint, so the rows line up. */
const SAMPLE_BLOCK_SIZE = vars.space.sp32;
const SAMPLE_INLINE_SIZE = '3.5rem';

function NeutralSample({ groupId, token }: { groupId: NeutralColorGroupId; token: ThemeToken }) {
	const value = `var(${token.variable})`;

	switch (groupId) {
		case 'surfaces':
			// A surface can match the page, so a control border marks its edge.
			return (
				<Box
					blockSize={SAMPLE_BLOCK_SIZE}
					borderColor="control"
					borderRadius="detail"
					borderStyle="solid"
					borderWidth="thin"
					inlineSize={SAMPLE_INLINE_SIZE}
					style={{ backgroundColor: value }}
				/>
			);
		case 'text':
			return (
				<Text
					fontWeight="emphasis"
					shouldDisableTrim
					style={{ color: value }}
					typography="heading4"
				>
					Aa
				</Text>
			);
		case 'borders':
			return (
				<Box
					blockSize={SAMPLE_BLOCK_SIZE}
					borderRadius="detail"
					borderStyle="solid"
					borderWidth="thick"
					inlineSize={SAMPLE_INLINE_SIZE}
					style={{ borderColor: value }}
				/>
			);
		case 'other':
			return token.path === 'color.overlay.backdrop' ? (
				<BackdropSample value={value} />
			) : (
				<Box
					blockSize={vars.space.sp12}
					borderRadius="detail"
					inlineSize="100%"
					style={{ backgroundColor: value }}
				/>
			);
	}
}

/**
 * The backdrop is translucent, so it covers a block that is half base surface and half solid
 * neutral fill. Its tint shows against both halves.
 */
function BackdropSample({ value }: { value: string }) {
	return (
		<Box
			blockSize={SAMPLE_BLOCK_SIZE}
			borderColor="decorative"
			borderRadius="detail"
			borderStyle="solid"
			borderWidth="thin"
			display="flex"
			inlineSize={SAMPLE_INLINE_SIZE}
			overflow="hidden"
			position="relative"
		>
			<Box backgroundColor="surface.base" flexGrow="1" />
			<Box backgroundColor="neutral.solid.rest" flexGrow="1" />
			<Box inset="0" position="absolute" style={{ backgroundColor: value }} />
		</Box>
	);
}
