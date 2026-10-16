import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { TrackProps } from './track.js';

test('Track keeps its root element a closed union', () => {
	expectTypeOf<TrackProps['elementType']>().toEqualTypeOf<'div' | 'li' | 'span' | undefined>();
});

test('Track rejects the prop values it does not support', () => {
	// @ts-expect-error — responsive gaps require an initial value
	assertType<TrackProps>({ gap: { bp768: 'sp16' } });
	// @ts-expect-error — spacing keys are strings
	assertType<TrackProps>({ gap: 0 });
	// @ts-expect-error — Track supports only its three documented root elements
	assertType<TrackProps>({ elementType: 'section' });
});
