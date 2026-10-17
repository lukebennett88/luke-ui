import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { LockupBodyProps, LockupProps, LockupRailProps } from './lockup.js';

test('Lockup keeps its element and alignment unions closed', () => {
	expectTypeOf<LockupProps['elementType']>().toEqualTypeOf<'div' | 'li' | 'span' | undefined>();
	expectTypeOf<LockupRailProps['elementType']>().toEqualTypeOf<'div' | 'span' | undefined>();
	expectTypeOf<LockupBodyProps['elementType']>().toEqualTypeOf<'div' | 'span' | undefined>();
	expectTypeOf<LockupProps['railAlignment']>().toEqualTypeOf<'center' | 'firstLine' | undefined>();
});

/** Flex item props a rail and the body own. Lockup itself accepts them. */
const ownedFlexItemProps = {
	alignSelf: 'center',
	flex: '1',
	flexBasis: '0',
	flexGrow: '1',
	flexShrink: '1',
	order: '1',
	placeSelf: 'center',
} as const;

test('Lockup parts accept the layout props they do not own', () => {
	assertType<LockupProps>({ ...ownedFlexItemProps, minInlineSize: '0', padding: 'sp8' });
	assertType<LockupRailProps>({ insetInlineStart: '0', minInlineSize: '0', position: 'relative' });
	assertType<LockupBodyProps>({
		maxInlineSize: '20rem',
		paddingBlock: 'sp4',
		position: 'relative',
	});
});

test('Lockup rejects the props it does not support', () => {
	// @ts-expect-error — railAlignment is not responsive
	assertType<LockupProps>({ railAlignment: { initial: 'center' } });
	// @ts-expect-error — responsive gaps require an initial value
	assertType<LockupProps>({ gap: { bp768: 'sp16' } });
	// @ts-expect-error — Lockup owns its flex layout
	assertType<LockupProps>({ alignItems: 'center' });
	// @ts-expect-error — elementType and renderRoot are mutually exclusive
	assertType<LockupProps>({ elementType: 'div', renderRoot: () => null as never });
	// @ts-expect-error — a part renders flow or phrasing containers only
	assertType<LockupRailProps>({ elementType: 'li' });

	// @ts-expect-error — a rail keeps its intrinsic inline size
	assertType<LockupRailProps>({ alignSelf: ownedFlexItemProps.alignSelf });
	// @ts-expect-error — a rail keeps its intrinsic inline size
	assertType<LockupRailProps>({ flex: ownedFlexItemProps.flex });
	// @ts-expect-error — a rail keeps its intrinsic inline size
	assertType<LockupRailProps>({ flexBasis: ownedFlexItemProps.flexBasis });
	// @ts-expect-error — a rail keeps its intrinsic inline size
	assertType<LockupRailProps>({ flexGrow: ownedFlexItemProps.flexGrow });
	// @ts-expect-error — a rail keeps its intrinsic inline size
	assertType<LockupRailProps>({ flexShrink: ownedFlexItemProps.flexShrink });
	// @ts-expect-error — a rail keeps its intrinsic inline size
	assertType<LockupRailProps>({ order: ownedFlexItemProps.order });
	// @ts-expect-error — a rail keeps its intrinsic inline size
	assertType<LockupRailProps>({ placeSelf: ownedFlexItemProps.placeSelf });
	// @ts-expect-error — the body owns how it grows and shrinks
	assertType<LockupBodyProps>({ alignSelf: ownedFlexItemProps.alignSelf });
	// @ts-expect-error — the body owns how it grows and shrinks
	assertType<LockupBodyProps>({ flex: ownedFlexItemProps.flex });
	// @ts-expect-error — the body owns how it grows and shrinks
	assertType<LockupBodyProps>({ flexBasis: ownedFlexItemProps.flexBasis });
	// @ts-expect-error — the body owns how it grows and shrinks
	assertType<LockupBodyProps>({ flexGrow: ownedFlexItemProps.flexGrow });
	// @ts-expect-error — the body owns how it grows and shrinks
	assertType<LockupBodyProps>({ flexShrink: ownedFlexItemProps.flexShrink });
	// @ts-expect-error — the body owns how it grows and shrinks
	assertType<LockupBodyProps>({ order: ownedFlexItemProps.order });
	// @ts-expect-error — the body owns how it grows and shrinks
	assertType<LockupBodyProps>({ placeSelf: ownedFlexItemProps.placeSelf });
	// @ts-expect-error — the body owns its minimum inline size
	assertType<LockupBodyProps>({ minInlineSize: '10rem' });
});
