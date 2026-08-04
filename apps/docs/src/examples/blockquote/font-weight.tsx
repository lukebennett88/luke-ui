import { Blockquote } from '@luke-ui/react/blockquote';
import { Box } from '@luke-ui/react/box';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="300" maxInlineSize="40rem">
			<Blockquote fontWeight="body">
				Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes
				near it in obstinacy.
			</Blockquote>
			<Blockquote fontWeight="label">
				Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes
				near it in obstinacy.
			</Blockquote>
			<Blockquote fontWeight="heading">
				Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes
				near it in obstinacy.
			</Blockquote>
			<Blockquote fontWeight="emphasis">
				Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes
				near it in obstinacy.
			</Blockquote>
		</Box>
	);
};
