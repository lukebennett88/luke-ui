import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useId } from 'react';
import { tokenSections } from '../lib/token-grammar.js';
import {
	TokenList,
	TokenPanel,
	TokenRow,
	TokenTile,
	TokenTileGrid,
} from './token-reference-parts.js';

// The scale sections of the token reference. Each sample applies the token it shows, through the
// token's own CSS variable, so it follows the active theme.

const { scales } = tokenSections;

/** The space scale, each step as a bar at its true width. */
export function SpaceTokens() {
	return (
		<TokenPanel>
			<TokenList>
				{scales.space.tokens.map((token) => (
					<TokenRow
						key={token.path}
						sample={
							<Box
								backgroundColor="accent.solid.rest"
								blockSize={vars.space.sp12}
								borderRadius="detail"
								style={{ inlineSize: `var(${token.variable})` }}
							/>
						}
						sampleInlineSize="6rem"
						token={token}
					/>
				))}
			</TokenList>
		</TokenPanel>
	);
}

/** What each radius rounds. */
const RADIUS_NOTES: Record<string, string> = {
	'radius.control': 'A button, input, or select',
	'radius.detail': 'A checkbox or a small part',
	'radius.full': 'A pill or a switch track',
	'radius.overlay': 'A dialog or a tray',
	'radius.surface': 'A card or a panel',
};

/** The radius roles, each on a shape large enough to tell the steps apart. */
export function RadiusTokens() {
	return (
		<Box marginBlockStart="sp24">
			<TokenTileGrid>
				{scales.radius.tokens.map((token) => (
					<TokenTile
						key={token.path}
						note={RADIUS_NOTES[token.path]}
						sample={
							<Box
								backgroundColor="accent.subtle.rest"
								blockSize="4.5rem"
								borderColor="accent"
								borderStyle="solid"
								borderWidth="thin"
								inlineSize="4.5rem"
								style={{ borderRadius: `var(${token.variable})` }}
							/>
						}
						token={token}
					/>
				))}
			</TokenTileGrid>
		</Box>
	);
}

/**
 * The depth ladder, each shadow on a card over a subdued surface, then the control finishes, each
 * on a solid fill the size of a control.
 */
export function DepthAndFinishTokens() {
	const depthLabelId = useId();
	const finishLabelId = useId();

	return (
		<Stack className="not-prose" gap="sp24" marginBlockStart="sp24">
			<Stack gap="sp12">
				<Text color="secondary" elementType="p" id={depthLabelId} typography="caption">
					Depth
				</Text>
				<TokenTileGrid labelledBy={depthLabelId}>
					{scales.depth.tokens.map((token) => (
						<TokenTile
							key={token.path}
							sample={
								<Box
									backgroundColor="surface.base"
									blockSize="4rem"
									borderRadius="surface"
									inlineSize="70%"
									style={{ boxShadow: `var(${token.variable})` }}
								/>
							}
							token={token}
						/>
					))}
				</TokenTileGrid>
			</Stack>
			<Stack gap="sp12">
				<Text color="secondary" elementType="p" id={finishLabelId} typography="caption">
					Control finish
				</Text>
				<TokenTileGrid labelledBy={finishLabelId}>
					{scales.controlFinish.tokens.map((token) => (
						<TokenTile
							key={token.path}
							sample={
								<Box
									backgroundColor="neutral.solid.rest"
									blockSize={vars.controlSize.medium}
									borderRadius="control"
									inlineSize="6rem"
									style={{ backgroundImage: `var(${token.variable})` }}
								/>
							}
							token={token}
						/>
					))}
				</TokenTileGrid>
			</Stack>
		</Stack>
	);
}

/** The control heights, each as a bar at its true block size. */
export function SizingTokens() {
	return (
		<TokenPanel>
			<TokenList>
				{scales.controlSize.tokens.map((token) => (
					<TokenRow
						key={token.path}
						sample={
							<Box
								backgroundColor="accent.subtle.rest"
								borderColor="accent"
								borderRadius="control"
								borderStyle="solid"
								borderWidth="thin"
								inlineSize="4rem"
								style={{ blockSize: `var(${token.variable})` }}
							/>
						}
						sampleInlineSize="4rem"
						token={token}
					/>
				))}
			</TokenList>
		</TokenPanel>
	);
}

/** The disabled fade, applied to a sample control beside one at rest. */
export function InteractionTokens() {
	return (
		<TokenPanel>
			<TokenList>
				{scales.interaction.tokens.map((token) => (
					<TokenRow
						key={token.path}
						sample={
							<Cluster flexWrap="nowrap" gap="sp8">
								<SampleControl label="Rest" />
								<SampleControl label="Disabled" opacity={`var(${token.variable})`} />
							</Cluster>
						}
						sampleInlineSize="10rem"
						token={token}
					/>
				))}
			</TokenList>
		</TokenPanel>
	);
}

/** A non-interactive picture of a small solid control. */
function SampleControl({ label, opacity }: { label: string; opacity?: string }) {
	return (
		<Box
			alignItems="center"
			backgroundColor="neutral.subtle.rest"
			blockSize={vars.controlSize.small}
			borderColor="control"
			borderRadius="control"
			borderStyle="solid"
			borderWidth="thin"
			display="flex"
			paddingInline="sp8"
			style={opacity === undefined ? undefined : { opacity }}
		>
			<Text fontWeight="label" typography="caption">
				{label}
			</Text>
		</Box>
	);
}
