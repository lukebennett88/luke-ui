import { AspectRatio } from '@luke-ui/react/aspect-ratio';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<AspectRatio
			elementType="figure"
			inlineSize="100%"
			margin="0"
			maxInlineSize="20rem"
			ratio="4 / 3"
		>
			<img
				alt="Looking up through a slot canyon toward blue sky"
				src="https://images.unsplash.com/photo-1479030160180-b1860951d696?auto=format&fit=crop&w=1200&q=80"
				style={{ borderRadius: vars.radius.detail }}
			/>
		</AspectRatio>
	);
};
