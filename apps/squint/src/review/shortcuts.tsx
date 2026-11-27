import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Grid } from '@luke-ui/react/grid';
import { Kbd } from '@luke-ui/react/kbd';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import { Fragment } from 'react';
import { Dialog, DialogTrigger, Heading, Popover } from 'react-aria-components';
import * as overlayStyles from './overlays.css.js';
import type { Shortcut } from './use-review-shortcuts.js';

type ShortcutsTriggerProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	shortcuts: ReadonlyArray<Shortcut>;
};

/** Lists the review's single-key shortcuts. `?` opens it too. */
export function ShortcutsTrigger({ isOpen, onOpenChange, shortcuts }: ShortcutsTriggerProps) {
	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
			<Button aria-keyshortcuts="?" prominence="low" size="medium">
				Shortcuts
			</Button>
			<Popover
				className={cx(overlayStyles.popover, overlayStyles.shortcutsPopover)}
				offset={8}
				placement="bottom end"
			>
				<Dialog aria-labelledby="shortcuts-title" className={overlayStyles.dialog}>
					<Box className={overlayStyles.dialogBody} display="grid" gap="space.12">
						<Heading className={overlayStyles.dialogTitle} id="shortcuts-title" level={2}>
							Keyboard shortcuts
						</Heading>
						<Grid
							alignItems="center"
							columnGap="space.16"
							columns="max-content minmax(0, 1fr)"
							elementType="dl"
							margin="0"
							rowGap="space.8"
						>
							{shortcuts.map(({ display, keys, label }) => (
								<Fragment key={label}>
									<dt>
										<Kbd>{display ?? Object.keys(keys).join(' ')}</Kbd>
									</dt>
									<Text color="secondary" elementType="dd" typography="label">
										{label}
									</Text>
								</Fragment>
							))}
						</Grid>
					</Box>
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
}
