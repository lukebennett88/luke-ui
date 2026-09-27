import { expect, test } from 'vite-plus/test';
import { formatDocsPlaygroundSource } from './playground-format.js';

test('formats with the docs style', async () => {
	const source = [
		`const x = {a:1,'b':"c"}`,
		`const y = a => <div className="x" id='y'>{a}</div>`,
		'call(firstArgument, secondArgument, thirdArgument, fourthArgument, fifthArgument, sixthArgument, seventh)',
	].join('\n');

	expect(await formatDocsPlaygroundSource(source)).toBe(
		[
			`const x = { a: 1, b: 'c' };`,
			'const y = (a) => (',
			'\t<div className="x" id="y">',
			'\t\t{a}',
			'\t</div>',
			');',
			'call(',
			'\tfirstArgument,',
			'\tsecondArgument,',
			'\tthirdArgument,',
			'\tfourthArgument,',
			'\tfifthArgument,',
			'\tsixthArgument,',
			'\tseventh,',
			');',
			'',
		].join('\n'),
	);
});

test('returns null for incomplete TSX', async () => {
	expect(await formatDocsPlaygroundSource('const incomplete = (')).toBeNull();
});
