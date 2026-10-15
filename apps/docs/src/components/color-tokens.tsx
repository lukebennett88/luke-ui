import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { ThemeToken } from '../generated/token-reference.generated.js';
import type { ColorFamilyId, Role } from '../lib/token-grammar.js';
import { roleLabel, tokenSections } from '../lib/token-grammar.js';
import { TokenGroup, TokenList, TokenPanel, TokenRow } from './token-reference-parts.js';

const SAMPLE_BLOCK_SIZE = vars.space.sp32;
const SAMPLE_INLINE_SIZE = '3.5rem';

/** One `vars.color.<family>` branch, grouped by role when the contract nests roles. */
export function ColorFamily({ family }: { family: ColorFamilyId }) {
	const section = tokenSections.colors.find((item) => item.id === family);
	if (section === undefined) return null;

	if (section.roles !== null) {
		return (
			<TokenPanel>
				{section.roles.map(({ role, tokens }) => (
					<TokenGroup key={role} label={roleLabel(role)}>
						{tokens.map((token) => (
							<TokenRow
								key={token.path}
								sample={<ColorSample family={family} role={role} token={token} />}
								sampleInlineSize={SAMPLE_INLINE_SIZE}
								token={token}
							/>
						))}
					</TokenGroup>
				))}
			</TokenPanel>
		);
	}

	return (
		<TokenPanel>
			<TokenList>
				{section.tokens.map((token) => (
					<TokenRow
						key={token.path}
						sample={<ColorSample family={family} token={token} />}
						sampleInlineSize={SAMPLE_INLINE_SIZE}
						token={token}
					/>
				))}
			</TokenList>
		</TokenPanel>
	);
}

function ColorSample({
	family,
	role,
	token,
}: {
	family: ColorFamilyId;
	role?: Role;
	token: ThemeToken;
}) {
	const value = `var(${token.variable})`;

	switch (family) {
		case 'background':
		case 'surface':
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
		case 'foreground':
			return (
				<Box
					alignItems="center"
					backgroundColor={
						token.path.endsWith('.onSolid') && role !== undefined
							? `${role}.solid.rest`
							: 'surface.base'
					}
					borderRadius="detail"
					display="flex"
					inlineSize={SAMPLE_INLINE_SIZE}
					justifyContent="center"
					minBlockSize={SAMPLE_BLOCK_SIZE}
				>
					<Text fontWeight="emphasis" style={{ color: value }} typography="label">
						Aa
					</Text>
				</Box>
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
		case 'border':
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
		case 'overlay':
			return <BackdropSample value={value} />;
		case 'loadingSkeleton':
			return (
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
