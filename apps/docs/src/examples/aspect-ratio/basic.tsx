import { AspectRatio } from '@luke-ui/react/aspect-ratio';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<AspectRatio inlineSize="100%" maxInlineSize="20rem" ratio="16 / 9">
			<iframe
				src="https://www.youtube.com/embed/K5uS5DIKQbU"
				style={{
					blockSize: '100%',
					borderRadius: vars.radius.detail,
					inlineSize: '100%',
				}}
				title="YouTube video player"
			/>
		</AspectRatio>
	);
};
