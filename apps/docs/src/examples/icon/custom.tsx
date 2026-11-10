import { iconRecipe } from '@luke-ui/react/icon';

export default () => {
	return (
		<svg
			aria-label="Add to favourites"
			className={iconRecipe({ size: 'small' })}
			fill="currentColor"
			role="img"
			viewBox="0 0 24 24"
		>
			<path d="M12 21a1 1 0 0 1-.7-.3L5 14.5a5 5 0 1 1 7-6 5 5 0 1 1 7 6l-6.3 6.2a1 1 0 0 1-.7.3Z" />
		</svg>
	);
};
