import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<ul>
			<Track elementType="li" gap="sp8" railStart={<Icon name="checkCircle" />}>
				Prepare the project brief
			</Track>
			<Track elementType="li" gap="sp8" railStart={<Icon name="checkCircle" />}>
				Schedule the stakeholder review
			</Track>
		</ul>
	);
};
