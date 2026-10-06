import { VisuallyHidden } from '@luke-ui/react/visually-hidden';

export default () => {
	return (
		<VisuallyHidden
			isFocusable
			renderRoot={(props) => (
				<a {...props} href="#main">
					Skip to main content
				</a>
			)}
		/>
	);
};
