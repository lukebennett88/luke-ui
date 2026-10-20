import { Button } from '@luke-ui/react/primitives/button';

export default () => {
	return (
		<Button
			style={({ isHovered, isPressed }) => {
				const scale: number = (() => {
					if (isPressed) return 0.98;
					if (isHovered) return 1.02;
					return 1;
				})();

				return {
					transform: `scale(${scale})`,
					transition: 'transform 100ms',
				};
			}}
		>
			Continue
		</Button>
	);
};
