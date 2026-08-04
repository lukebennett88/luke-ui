import { Blockquote } from '@luke-ui/react/blockquote';
import { Box } from '@luke-ui/react/box';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="30rem">
			<Blockquote lineClamp>
				Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes
				near it in obstinacy.
			</Blockquote>
			<Blockquote lineClamp={2}>
				Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes
				near it in obstinacy.
			</Blockquote>
		</Box>
	);
};
