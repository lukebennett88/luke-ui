/* oxlint-disable unicorn/consistent-function-scoping -- the nested components close over `Box`, which the rule does not see through JSX */
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { BoxComponent, BoxProps } from './box.js';

// Every case marks the surface a child is measured against with `data-parent`, and the child with
// either `data-check="geometry"` (its corners must equal the parent's corners minus the measured
// inset on each side) or `data-expect-radius` (a documented fallback, in px, on every corner).

const fills = ['#dbe4ff', '#91a7ff', '#4c6ef5', '#364fc7', '#1b2a6b', '#0b1030', '#000'];

type Published = Record<string, string>;

/** Builds the fixture for one Box implementation, so both builds render the same tree. */
export function createFixture(Box: BoxComponent) {
	/** The surface a child is measured against. */
	function Surface(props: BoxProps) {
		return <Box backgroundColor={fills[0]} borderRadius="overlay" data-parent="" {...props} />;
	}

	/** A child that asks for concentric corners. */
	function Inner({ level = 1, ...props }: BoxProps & { level?: number }) {
		return (
			<Box
				backgroundColor={fills[level]}
				borderRadius="concentric"
				data-check="geometry"
				padding="space.8"
				{...props}
			>
				{props.children ?? <span style={{ color: '#fff' }}>&nbsp;</span>}
			</Box>
		);
	}

	/** Directly nested concentric Boxes, each measured against the one around it. */
	function chain(depth: number, level = 1): ReactNode {
		if (level > depth) return null;
		return (
			<Inner data-level={level} data-parent="" level={Math.min(level, 6)} padding="space.4">
				{chain(depth, level + 1)}
			</Inner>
		);
	}

	function Fixture(props: { portal: boolean; published?: { setA: Published; setB: Published } }) {
		return (
			<Box display="grid" gap="space.16" padding="space.16" style={grid}>
				<Case id="uniform" title="Uniform padding, four levels">
					<Surface padding="space.4" borderRadius="overlay">
						{chain(4)}
					</Surface>
				</Case>
				<Case id="axes" title="Inline and block padding differ">
					<Surface paddingBlock="space.4" paddingInline="space.12">
						<Inner />
					</Surface>
				</Case>
				<Case id="sides" title="Four different logical sides">
					<Surface
						paddingBlockEnd="space.8"
						paddingBlockStart="space.4"
						paddingInlineEnd="space.24"
						paddingInlineStart="space.12"
					>
						<Inner />
					</Surface>
				</Case>
				<Case dir="rtl" id="sides-rtl" title="Four different logical sides, RTL">
					<Surface
						paddingBlockEnd="space.8"
						paddingBlockStart="space.4"
						paddingInlineEnd="space.24"
						paddingInlineStart="space.12"
					>
						<Inner />
					</Surface>
				</Case>
				<Case id="border" title="Padding plus a 2px border">
					<Surface borderColor="#364fc7" borderStyle="solid" borderWidth="thick" padding="space.8">
						<Inner />
					</Surface>
				</Case>
				<Case id="border-undrawn" title="borderWidth without borderStyle draws nothing">
					<Surface borderWidth="thick" padding="space.8">
						<Inner />
					</Surface>
				</Case>
				<Case id="border-responsive" title="Border appears at bp768">
					<Surface
						borderColor="#364fc7"
						borderStyle={{ bp768: 'solid', initial: 'none' }}
						borderWidth="thick"
						padding="space.8"
					>
						<Inner />
					</Surface>
				</Case>
				<Case id="border-sides" title="Non-Box surface with asymmetric borders">
					<div data-parent="" style={recipeSurface(props.published)}>
						<Inner />
					</div>
				</Case>
				<Case id="responsive" title="Responsive radius and padding">
					<Surface
						borderRadius={{ bp768: 'overlay', initial: 'control' }}
						padding={{ bp1024: 'space.12', bp768: 'space.8', initial: 'space.4' }}
					>
						<Inner />
					</Surface>
				</Case>
				<Case id="precedence-axis" title="padding with responsive paddingInline">
					<Surface padding="space.24" paddingInline={{ bp768: 'space.4' }}>
						<Inner />
					</Surface>
				</Case>
				<Case id="precedence-side" title="Responsive padding with a fixed side">
					<Surface padding={{ bp768: 'space.4', initial: 'space.12' }} paddingInlineStart="space.8">
						<Inner />
					</Surface>
				</Case>
				<Case id="precedence-mixed" title="Shorthand, axis and side at different breakpoints">
					<Surface
						padding={{ bp1024: 'space.4', initial: 'space.8' }}
						paddingBlock={{ bp768: 'space.12' }}
						paddingBlockEnd={{ bp1024: '0' }}
					>
						<Inner />
					</Surface>
				</Case>
				<Case id="clamp" title="Radius smaller than the inset">
					<Surface borderRadius="control" padding="space.24">
						<Inner />
					</Surface>
				</Case>
				<Case id="full" title="Pill parent">
					<Surface borderRadius="full" padding="space.8">
						<Inner />
					</Surface>
				</Case>
				<Case id="no-radius" title="Parent with padding and no radius">
					<Box backgroundColor={fills[0]} data-parent="" padding="space.8">
						<Inner />
					</Box>
				</Case>
				<Case id="flush" title="Parent with a radius and no padding">
					<Surface>
						<Inner />
					</Surface>
				</Case>
				<Case id="override" title="Explicit radius between two concentric levels">
					<Surface padding="space.4">
						<Inner borderRadius="control" data-check={undefined} data-parent="" padding="space.4">
							<Inner level={2} />
						</Inner>
					</Surface>
				</Case>
				<Case id="wrapper-box" title="Layout Box between">
					<Surface padding="space.8">
						<Box display="flex" flexDirection="column">
							<Inner />
						</Box>
					</Surface>
				</Case>
				<Case id="wrapper-div" title="Plain element between">
					<Surface padding="space.8">
						<section>
							<Inner />
						</section>
					</Surface>
				</Case>
				<Case id="wrapper-concentric" title="Padded wrapper that opts in">
					<Surface padding="space.4">
						<Box borderRadius="concentric" padding="space.4">
							<Inner />
						</Box>
					</Surface>
				</Case>
				<Case id="separated" title="Concentric levels separated by a surface">
					<Surface padding="space.4">
						<Inner padding="space.4">
							<Surface padding="space.4">
								<Inner data-level={1} data-parent="" padding="space.4">
									<Inner data-level={2} level={2} padding="space.4" />
								</Inner>
							</Surface>
						</Inner>
					</Surface>
				</Case>
				<Case id="eight" title="Eight directly nested levels">
					<Surface borderRadius="full" padding="space.4">
						{chain(8)}
					</Surface>
				</Case>
				<Case id="separated-deep" title="Fifth concentric ancestor, directly nested">
					<Surface padding="space.4">
						<Inner padding="space.4">
							<Surface padding="space.4">
								<Inner padding="space.4">
									<Surface padding="space.4">
										<Inner padding="space.4">
											<Surface padding="space.4">
												<Inner data-level={4} data-parent="" padding="space.4">
													<Inner data-level={5} level={2} padding="space.4" />
												</Inner>
											</Surface>
										</Inner>
									</Surface>
								</Inner>
							</Surface>
						</Inner>
					</Surface>
				</Case>
				<Case id="wrapper-padded" title="Padded Box with no radius between">
					<Surface padding="space.4">
						<Box padding="space.4">
							<Inner />
						</Box>
					</Surface>
				</Case>
				<Case id="wrapper-chain" title="Two padded Boxes between, different sides">
					<Surface padding="space.4">
						<Box paddingBlock="space.4">
							<Box display="flex" flexDirection="column" paddingInlineStart="space.8">
								<Inner />
							</Box>
						</Box>
					</Surface>
				</Case>
				<Case id="wrapper-border" title="Bordered Box with no radius between">
					<Surface padding="space.4">
						<Box borderColor="#364fc7" borderStyle="solid" borderWidth="thin" padding="space.4">
							<Inner />
						</Box>
					</Surface>
				</Case>
				<Case id="wrapper-responsive" title="Wrapper padding changes at bp768">
					<Surface padding="space.4">
						<Box padding={{ bp768: 'space.8', initial: '0' }}>
							<Inner />
						</Box>
					</Surface>
				</Case>
				<Case id="wrapper-outside" title="Padded Boxes around the surface are ignored">
					<Box padding="space.8">
						<Box padding="space.4">
							<Surface padding="space.4">
								<Box padding="space.4">
									<Inner data-level={1} data-parent="">
										<Box padding="space.4">
											<Inner data-level={2} level={2} />
										</Box>
									</Inner>
								</Box>
							</Surface>
						</Box>
					</Box>
				</Case>
				<Case id="style-padding" title="Unsupported: padding from style">
					<Surface padding="space.4" style={{ padding: 16 }}>
						<Inner data-check={undefined} data-expect-radius="12" />
					</Surface>
				</Case>
				<Case id="div-padding" title="Unsupported: padded plain element between">
					<Surface padding="space.4">
						<div style={{ padding: 12 }}>
							<Inner data-check={undefined} data-expect-radius="12" />
						</div>
					</Surface>
				</Case>
				<Case id="margin" title="Unsupported: child with a margin">
					<Surface padding="space.4">
						<Inner data-check={undefined} data-expect-radius="12" margin="space.8" />
					</Surface>
				</Case>
				<Case id="orphan" title="No Box ancestor with geometry">
					<Inner data-check={undefined} data-expect-radius="0" />
				</Case>
				<Case id="portal" title="Portalled out of its surface">
					<Surface padding="space.8">
						{props.portal
							? createPortal(
									<div style={{ inlineSize: 120, padding: 16 }}>
										<Inner data-case="portal" data-check={undefined} data-expect-radius="0" />
									</div>,
									document.body,
								)
							: null}
					</Surface>
				</Case>
			</Box>
		);
	}

	return Fixture;
}

const grid: CSSProperties = { gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' };

function Case(props: { children: ReactNode; dir?: string; id: string; title: string }) {
	return (
		<div data-case={props.id} dir={props.dir}>
			<div style={{ marginBlockEnd: 4 }}>{props.title}</div>
			{props.children}
		</div>
	);
}

/**
 * What a first-party recipe would write: a surface that is not a Box publishes its own inner
 * corners, here with a different border width on every side.
 */
function recipeSurface(published?: { setA: Published; setB: Published }): CSSProperties {
	const borders = { be: 1, bs: 6, ie: 2, is: 10 };
	const padding = 4;
	const radius = 20;
	const vars: Record<string, string> = {};
	for (const set of published ? [published.setA, published.setB] : []) {
		for (const side of ['bs', 'be', 'is', 'ie'] as const) {
			vars[set[side]!.slice(4, -1)] = `${Math.max(0, radius - padding - borders[side])}px`;
		}
	}
	return {
		background: fills[0],
		borderBlockEndWidth: borders.be,
		borderBlockStartWidth: borders.bs,
		borderColor: '#364fc7',
		borderInlineEndWidth: borders.ie,
		borderInlineStartWidth: borders.is,
		borderRadius: radius,
		borderStyle: 'solid',
		padding,
		...vars,
	};
}
