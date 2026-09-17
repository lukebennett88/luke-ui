import { Button } from '@luke-ui/react/button';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<Track gap="sp8" railAlignment="firstLine" railEnd={<Button size="small">Undo</Button>}>
			Example item with a second line of wrapped content, so the rail sits against the first line
			only.
		</Track>
	);
};
