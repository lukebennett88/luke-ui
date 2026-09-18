import { AspectRatio } from '@luke-ui/react/aspect-ratio';
import { Container } from '@luke-ui/react/container';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<Container maxInlineSize="ct672">
			<AspectRatio inlineSize="100%" ratio="16 / 9">
				<iframe
					src="https://www.youtube.com/embed/K5uS5DIKQbU"
					style={{ borderRadius: vars.radius.detail }}
					title="YouTube video player"
				/>
			</AspectRatio>
		</Container>
	);
};
