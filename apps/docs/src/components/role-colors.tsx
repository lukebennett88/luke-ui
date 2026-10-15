import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import type { ThemeToken } from '../generated/token-reference.generated.js';
import type { Role } from '../lib/token-grammar.js';
import { tokenSections } from '../lib/token-grammar.js';
import { TokenList, TokenPanel, TokenRow } from './token-reference-parts.js';

/** Every colour token for one semantic role, in contract order. */
export function RoleColors({ colorRole: role }: { colorRole: Role }) {
	const row = tokenSections.roleColors.find((item) => item.role === role);
	if (row === undefined) return null;

	return (
		<TokenPanel>
			<TokenList>
				{row.tokens.map((token) => (
					<TokenRow
						key={token.path}
						sample={<RoleSample role={role} token={token} />}
						sampleInlineSize="3.5rem"
						token={token}
					/>
				))}
			</TokenList>
		</TokenPanel>
	);
}

function RoleSample({ role, token }: { role: Role; token: ThemeToken }) {
	const value = `var(${token.variable})`;
	if (token.path.startsWith('color.background.')) {
		return (
			<Box
				blockSize="2rem"
				borderColor="control"
				borderRadius="detail"
				borderStyle="solid"
				borderWidth="thin"
				inlineSize="3.5rem"
				style={{ backgroundColor: value }}
			/>
		);
	}
	if (token.path.startsWith('color.border.')) {
		return (
			<Box
				blockSize="2rem"
				borderRadius="detail"
				borderStyle="solid"
				borderWidth="thick"
				inlineSize="3.5rem"
				style={{ borderColor: value }}
			/>
		);
	}
	return (
		<Box
			alignItems="center"
			backgroundColor={token.path.endsWith('.onSolid') ? `${role}.solid.rest` : 'surface.base'}
			borderRadius="detail"
			display="flex"
			inlineSize="3.5rem"
			justifyContent="center"
			minBlockSize="2rem"
		>
			<Text fontWeight="emphasis" style={{ color: value }} typography="label">
				Aa
			</Text>
		</Box>
	);
}
