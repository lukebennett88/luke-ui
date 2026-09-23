import { ScrollMask } from '@luke-ui/react/scroll-mask';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default function Basic() {
	return (
		<ScrollMask aria-label="Topics" inlineSize="16rem" padding="sp12">
			<div style={{ display: 'flex', gap: vars.space.sp16 }}>
				{['Overview', 'Installation', 'Theming', 'Layout', 'Forms', 'Feedback'].map((item) => (
					<Text key={item} style={{ flex: 'none' }}>
						{item}
					</Text>
				))}
			</div>
		</ScrollMask>
	);
}
