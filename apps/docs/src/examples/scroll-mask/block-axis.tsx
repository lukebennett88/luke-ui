import { ScrollMask } from '@luke-ui/react/scroll-mask';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default function BlockAxis() {
	return (
		<ScrollMask
			aria-label="Release notes"
			axis="block"
			blockSize="10rem"
			inlineSize="20rem"
			padding="sp12"
		>
			<div style={{ display: 'grid', gap: vars.space.sp12 }}>
				{[
					'ScrollMask masks overflow edges automatically.',
					'The scrollport is focusable only while content overflows.',
					'Choose axis="block" for block-axis scrolling.',
					'Native scrollbars stay available.',
					'Fade depth adapts to the scrollport size.',
				].map((item) => (
					<Text key={item}>{item}</Text>
				))}
			</div>
		</ScrollMask>
	);
}
