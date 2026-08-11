import { Blockquote } from '@luke-ui/react/blockquote';
import { Box } from '@luke-ui/react/box';

const sizes = ['caption', 'label', 'body', 'lead', 'heading4', 'heading3', 'heading2', 'heading1', 'display'] as const;

export default () => {
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
};
