import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { tokenSections } from '../lib/token-grammar.js';
import { TokenGroup, TokenList, TokenPanel, TokenRow } from './token-reference-parts.js';

// The scale sections of the token reference. Each sample applies the token it shows, through the
// token's own CSS variable, so it follows the active theme.

const { scales } = tokenSections;

const RADIUS_SAMPLE_SIZE = '4.5rem';
const DEPTH_FINISH_SAMPLE_SIZE = '5rem';

/** The space scale, each step as a bar at its true width. */
export function SpaceTokens() {
	return (
		<TokenPanel sampleInlineSize="6rem">
			<TokenList>
				{scales.space.tokens.map((token) => (
					<TokenRow
						key={token.path}
						sample={
							<Box
								backgroundColor="accent.solid"
								blockSize={vars.space['12']}
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
		<TokenPanel sampleInlineSize={RADIUS_SAMPLE_SIZE}>
			<TokenList>
				{scales.radius.tokens.map((token) => (
					<TokenRow
						key={token.path}
						note={RADIUS_NOTES[token.path]}
						sample={
							<Box
								backgroundColor="accent.subtle"
								blockSize={RADIUS_SAMPLE_SIZE}
								borderColor="accent"
								borderStyle="solid"
								borderWidth="thin"
								inlineSize={RADIUS_SAMPLE_SIZE}
								style={{ borderRadius: `var(${token.variable})` }}
							/>
						}
						sampleInlineSize={RADIUS_SAMPLE_SIZE}
						token={token}
					/>
				))}
			</TokenList>
		</TokenPanel>
	);
}

/**
 * The depth ladder, each shadow on a card over a subdued surface, then the control finishes, each
 * on a solid fill the size of a control.
 */
export function DepthAndFinishTokens() {
	return (
		<TokenPanel sampleInlineSize={DEPTH_FINISH_SAMPLE_SIZE}>
			<TokenGroup label="Depth">
				{scales.depth.tokens.map((token) => (
					<TokenRow
						key={token.path}
						sample={
							<Box
								alignItems="center"
								backgroundColor="surface.subdued"
								blockSize="4rem"
								borderRadius="detail"
								display="flex"
								inlineSize={DEPTH_FINISH_SAMPLE_SIZE}
								justifyContent="center"
								padding="space.8"
							>
								<Box
									backgroundColor="surface.base"
									blockSize="2.75rem"
									borderRadius="surface"
									inlineSize="85%"
									style={{ boxShadow: `var(${token.variable})` }}
								/>
							</Box>
						}
						sampleInlineSize={DEPTH_FINISH_SAMPLE_SIZE}
						token={token}
					/>
				))}
			</TokenGroup>
			<TokenGroup label="Control finish">
				{scales.controlFinish.tokens.map((token) => (
					<TokenRow
						key={token.path}
						sample={
							<Box
								backgroundColor="neutral.solid"
								blockSize={vars.controlSize.px40}
								borderRadius="control"
								inlineSize={DEPTH_FINISH_SAMPLE_SIZE}
								style={{ backgroundImage: `var(${token.variable})` }}
							/>
						}
						sampleInlineSize={DEPTH_FINISH_SAMPLE_SIZE}
						token={token}
					/>
				))}
			</TokenGroup>
		</TokenPanel>
	);
}

/** The control heights, each as a bar at its true block size. */
export function SizingTokens() {
	return (
		<TokenPanel sampleInlineSize="4rem">
			<TokenList>
				{scales.controlSize.tokens.map((token) => (
					<TokenRow
						key={token.path}
						sample={
							<Box
								backgroundColor="accent.subtle"
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
		<TokenPanel sampleInlineSize="10rem">
			<TokenList>
				{scales.interaction.tokens.map((token) => (
					<TokenRow
						key={token.path}
						sample={
							<Cluster flexWrap="nowrap" gap="space.8">
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
			backgroundColor="neutral.subtle"
			blockSize={vars.controlSize.px32}
			borderColor="control"
			borderRadius="control"
			borderStyle="solid"
			borderWidth="thin"
			display="flex"
			paddingInline="space.8"
			style={opacity === undefined ? undefined : { opacity }}
		>
			<Text fontWeight="label" typography="caption">
				{label}
			</Text>
		</Box>
	);
}
