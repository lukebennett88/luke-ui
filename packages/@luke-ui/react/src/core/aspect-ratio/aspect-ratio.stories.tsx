import type { AspectRatioProps } from '@luke-ui/react/aspect-ratio';
import { AspectRatio } from '@luke-ui/react/aspect-ratio';
import { vars } from '@luke-ui/react/theme';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: AspectRatio,
	tags: ['layout'],
	title: 'Layout/Aspect ratio',
});

/** Lock media to an inline-to-block ratio. */
export const Default = meta.story({
	args: {
		children: (
			<MediaImage
				alt="Sunlit trees in a forest"
				src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
			/>
		),
		inlineSize: '100%',
		maxInlineSize: '20rem',
		ratio: '16 / 9',
	} satisfies AspectRatioProps,
});

export const Figure = meta.story({
	args: {
		children: (
			<MediaImage
				alt="Looking up between tall canyon walls at a strip of blue sky"
				src="https://images.unsplash.com/photo-1479030160180-b1860951d696?auto=format&fit=crop&w=1200&q=80"
			/>
		),
		elementType: 'figure',
		inlineSize: '100%',
		margin: '0',
		maxInlineSize: '20rem',
		ratio: '4 / 3',
	} satisfies AspectRatioProps,
});

/** Show how contain differs from the default cover fit. */
export const Contain = meta.story({
	args: {
		children: (
			<MediaImage
				alt="Tall canyon walls with a narrow sky strip"
				src="https://images.unsplash.com/photo-1479030160180-b1860951d696?auto=format&fit=crop&w=800&h=1200&q=80"
			/>
		),
		inlineSize: '100%',
		maxInlineSize: '20rem',
		objectFit: 'contain',
		ratio: '16 / 9',
	} satisfies AspectRatioProps,
});

function MediaImage({ alt, src }: { alt: string; src: string }) {
	return <img alt={alt} src={src} style={{ borderRadius: vars.radius.detail }} />;
}
