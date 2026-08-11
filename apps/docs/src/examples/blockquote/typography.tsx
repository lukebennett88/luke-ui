import { Blockquote } from '@luke-ui/react/blockquote';
import { Box } from '@luke-ui/react/box';
import { typeStyles } from '@luke-ui/react/theme';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="50rem">
			{typeStyles.map((typography) => (
				<Blockquote key={typography} typography={typography}>
					Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone
					comes near it in obstinacy.
				</Blockquote>
			))}
		</Box>
	);
};
