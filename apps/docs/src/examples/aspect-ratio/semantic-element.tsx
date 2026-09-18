import { AspectRatio } from '@luke-ui/react/aspect-ratio';
import { Container } from '@luke-ui/react/container';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<Container maxInlineSize="ct672">
			<AspectRatio elementType="figure" ratio="4 / 3">
				<img
					alt="Looking up between tall canyon walls at a strip of blue sky"
					src="https://images.unsplash.com/photo-1479030160180-b1860951d696?auto=format&fit=crop&w=1200&q=80"
					style={{ borderRadius: vars.radius.detail }}
				/>
			</AspectRatio>
		</Container>
	);
};
