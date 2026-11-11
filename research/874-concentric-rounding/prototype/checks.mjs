/* oxlint-disable unicorn/consistent-function-scoping -- `measure` is serialised into the page, so it cannot reach module scope */
/** Runs in the page. Measures every Box and checks each marked child against its surface. */
export function measure() {
	const px = (value) => Number.parseFloat(value);
	const corner = (style, name) => {
		const [h, v = h] = style[name].split(' ').map(px);
		return { h, v };
	};
	const radii = (element) => {
		const style = getComputedStyle(element);
		return {
			bl: corner(style, 'borderBottomLeftRadius'),
			br: corner(style, 'borderBottomRightRadius'),
			tl: corner(style, 'borderTopLeftRadius'),
			tr: corner(style, 'borderTopRightRadius'),
		};
	};
	const sideOf = {
		bl: ['left', 'bottom'],
		br: ['right', 'bottom'],
		tl: ['left', 'top'],
		tr: ['right', 'top'],
	};
	const checks = [];
	for (const child of document.querySelectorAll('[data-check], [data-expect-radius]')) {
		const id = child.closest('[data-case]').dataset.case;
		const level = child.dataset.level ? `#${child.dataset.level}` : '';
		const actual = radii(child);
		if (child.dataset.expectRadius !== undefined) {
			const expected = Number(child.dataset.expectRadius);
			const pass = Object.values(actual).every(({ h, v }) => h === expected && v === expected);
			checks.push({ actual, expected, id: id + level, kind: 'documented', pass });
			continue;
		}
		// `data-parent-from` marks a surface that only exists from that viewport width.
		let parent = child.parentElement.closest('[data-parent]');
		while (Number(parent.dataset.parentFrom ?? 0) > innerWidth) {
			parent = parent.parentElement.closest('[data-parent]');
		}
		const outer = radii(parent);
		const a = parent.getBoundingClientRect();
		const b = child.getBoundingClientRect();
		// The inset is measured from layout, not read from the variables under test.
		const inset = {
			bottom: a.bottom - b.bottom,
			left: b.left - a.left,
			right: a.right - b.right,
			top: b.top - a.top,
		};
		const expected = {};
		let pass = true;
		for (const [name, [horizontal, vertical]] of Object.entries(sideOf)) {
			expected[name] = {
				h: Math.max(0, outer[name].h - inset[horizontal]),
				v: Math.max(0, outer[name].v - inset[vertical]),
			};
			// A corner with either radius at zero is square, so the other axis does not matter.
			const square = expected[name].h === 0 || expected[name].v === 0;
			const drawnSquare = actual[name].h === 0 || actual[name].v === 0;
			const same =
				Math.abs(expected[name].h - actual[name].h) < 0.01 &&
				Math.abs(expected[name].v - actual[name].v) < 0.01;
			if (!(same || (square && drawnSquare))) pass = false;
		}
		checks.push({ actual, expected, id: id + level, inset, kind: 'geometry', outer, pass });
	}
	const layout = [...document.querySelectorAll('#root div')].map((element) => {
		const rect = element.getBoundingClientRect();
		const style = getComputedStyle(element);
		return [rect.x, rect.y, rect.width, rect.height, style.padding, style.borderWidth].join(',');
	});
	const styled = [...document.querySelectorAll('#root [class]')];
	return {
		checks,
		inlineProperties: styled.map((element) => element.style.length),
		layout,
	};
}
