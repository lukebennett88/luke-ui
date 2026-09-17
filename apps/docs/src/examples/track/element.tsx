import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<ul>
			<Track elementType="li" gap="sp8" railStart={<Icon name="checkCircle" />}>
				First example item
			</Track>
			<Track elementType="li" gap="sp8" railStart={<Icon name="checkCircle" />}>
				Second example item
			</Track>
		</ul>
	);
};
