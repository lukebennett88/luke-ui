import { ExampleItem } from '#docs';
import { breakpoints } from '@luke-ui/react/styles';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<>
			<style>{`
				.layout-breakpoints {
					display: flex;
					flex-direction: column;
					gap: ${vars.space.sp12};
				}

				@container (inline-size >= ${breakpoints.bp768}px) {
					.layout-breakpoints {
						flex-direction: row;
					}
				}
			`}</style>
			<div className="layout-breakpoints">
				<ExampleItem style={{ flex: 1 }}>First</ExampleItem>
				<ExampleItem style={{ flex: 1 }}>Second</ExampleItem>
			</div>
		</>
	);
};
