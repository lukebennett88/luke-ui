import { Button } from '@luke-ui/react/button/primitive';
import { mergeProps } from '@luke-ui/react/utils';

export default function AnimatedButton() {
	return (
		<Button
			render={(domProps, { isHovered, isPressed }) => {
				const scale: number = (() => {
					if (isPressed) return 0.98;
					if (isHovered) return 1.02;
					return 1;
				})();

				const buttonProps = mergeProps(domProps, {
					style: {
						transform: `scale(${scale})`,
						transition: 'transform 100ms',
					},
				});

				return <button {...buttonProps} />;
			}}
		>
			Continue
		</Button>
	);
}
