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
const SHADOW_FINISH_SAMPLE_SIZE = '5rem';

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
								borderRadius="detail"
								style={{
									blockSize: vars.space['12'],
									inlineSize: `var(${token.variable})`,
								}}
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
								borderColor="decorative"
								borderStyle="solid"
								borderWidth="thin"
								style={{
									blockSize: RADIUS_SAMPLE_SIZE,
									borderRadius: `var(${token.variable})`,
									inlineSize: RADIUS_SAMPLE_SIZE,
								}}
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
 * The shadow ladder, each shadow on a card over a subdued surface, then the control finishes, each
 * on a solid fill the size of a control.
 */
export function ShadowAndFinishTokens() {
	return (
		<TokenPanel sampleInlineSize={SHADOW_FINISH_SAMPLE_SIZE}>
			<TokenGroup label="Shadow">
				{scales.shadow.tokens.map((token) => (
					<TokenRow
						key={token.path}
						sample={
							<Box
								alignItems="center"
								backgroundColor="surface.subdued"
								borderRadius="detail"
								display="flex"
								justifyContent="center"
								padding="space.8"
								style={{ blockSize: '4rem', inlineSize: SHADOW_FINISH_SAMPLE_SIZE }}
							>
								<Box
									backgroundColor="surface.base"
									borderRadius="surface"
									style={{
										blockSize: '2.75rem',
										boxShadow: `var(${token.variable})`,
										inlineSize: '85%',
									}}
								/>
							</Box>
						}
						sampleInlineSize={SHADOW_FINISH_SAMPLE_SIZE}
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
								borderRadius="control"
								style={{
									backgroundImage: `var(${token.variable})`,
									blockSize: vars.controlSize['40'],
									inlineSize: SHADOW_FINISH_SAMPLE_SIZE,
								}}
							/>
						}
						sampleInlineSize={SHADOW_FINISH_SAMPLE_SIZE}
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
								borderColor="decorative"
								borderRadius="control"
								borderStyle="solid"
								borderWidth="thin"
								style={{ blockSize: `var(${token.variable})`, inlineSize: '4rem' }}
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
			borderColor="control"
			borderRadius="control"
			borderStyle="solid"
			borderWidth="thin"
			display="flex"
			paddingInline="space.8"
			style={{
				blockSize: vars.controlSize['32'],
				...(opacity === undefined ? {} : { opacity }),
			}}
		>
			<Text fontWeight="label" typography="caption">
				{label}
			</Text>
		</Box>
	);
}
