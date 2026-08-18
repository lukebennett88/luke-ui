import { expect, test } from 'vite-plus/test';
import {
	formatVisualCaptureName,
	formatVisualViewport,
	parseVisualCaptureIdentity,
} from './visual-capture-id.js';

test('parses the capture name the browser helper writes, including full viewport and height', () => {
	const viewport = formatVisualViewport(1024, 800);
	const captureName = formatVisualCaptureName('button/kitchen-sink', viewport);
	const identity = parseVisualCaptureIdentity(captureName);

	expect(captureName).toBe('button/kitchen-sink__viewport-1024x800');
	expect(identity).toEqual({
		id: 'button/kitchen-sink',
		viewport: '1024x800',
		viewportHeight: 800,
		viewportWidth: 1024,
	});
	expect(identity?.viewport).toBe(viewport);
	expect(identity?.viewportHeight).toBe(800);
});

test('leaves a capture with no viewport token unparsed', () => {
	expect(parseVisualCaptureIdentity('legacy')).toBeUndefined();
	expect(parseVisualCaptureIdentity('button/sink__viewport-tall')).toBeUndefined();
});
