import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

const plainListStyle = { listStyle: 'none' } as const;

export default () => {
	return (
		<Box elementType="ul" margin="0" padding="0" style={plainListStyle}>
			<Track elementType="li" gap="sp8" railStart={<Icon name="checkCircle" />}>
				First item
			</Track>
			<Track elementType="li" gap="sp8" railStart={<Icon name="checkCircle" />}>
				Second item
			</Track>
		</Box>
	);
};
