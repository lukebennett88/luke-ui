import { Blockquote } from '@luke-ui/react/blockquote';
import { Box } from '@luke-ui/react/box';

const sizes = ['100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

export default function Size() {
	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="50rem">
			{sizes.map((size) => (
				<Blockquote key={size} size={size}>
					Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone
					comes near it in obstinacy.
				</Blockquote>
			))}
		</Box>
	);
}
