import type { DocsType } from '@luke-ui-internal/docs';

import { Button } from './button';

export const docs: DocsType = {
	meta: {
		name: 'Button',
		category: 'Content',
	},
	description: (
		<>
			<p>
				Buttons are clickable elements that are used to trigger actions. They
				communicate calls to action to the user and allow users to interact with
				pages in a variety of ways. Button labels express what action will occur
				when the user interacts with it.
			</p>
		</>
	),
	examples: [
		{
			name: 'Type',
			description: (
				<>
					<p>The default behavior of the button. Possible values are:</p>
					<ul>
						<li>
							<p>
								<strong>submit:</strong> The button submits the form data to the
								server. This is the default if the attribute is not specified
								for buttons associated with a <code>{'<form>'}</code>, or if the
								attribute is an empty or invalid value.
							</p>
							<p>
								<Button type="submit">submit</Button>
							</p>
						</li>
						<li>
							<p>
								<strong>reset:</strong> The button resets all the controls to
								their initial values, like <code>{'<input type="reset">'}</code>
								. (This behavior tends to annoy users.)
							</p>
							<p>
								<Button type="reset">reset</Button>
							</p>
						</li>
						<li>
							<p>
								<strong>button:</strong> The button has no default behavior, and
								does nothing when pressed by default. It can have client-side
								scripts listen to the element's events, which are triggered when
								the events occur.
							</p>
							<p>
								<Button type="button">button</Button>
							</p>
						</li>
					</ul>
				</>
			),
		},
	],
};
