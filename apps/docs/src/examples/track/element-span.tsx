import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<p>
			<Track elementType="span" gap="sp4" railStart={<Icon name="checkCircle" />}>
				Payment complete
			</Track>
			.
		</p>
	);
};
