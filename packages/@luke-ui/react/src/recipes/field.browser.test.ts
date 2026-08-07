import '@luke-ui/react/themes/tactile/stylesheet.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { rootClassName } from '../theme/index.js';
import { themeClassName as tactileThemeClassName } from '../themes/tactile/index.js';
import { cx } from '../utils/index.js';
import { field } from './field.css.js';

let mounted: Array<HTMLElement> = [];

afterEach(() => {
	for (const element of mounted) element.remove();
	mounted = [];
});

test('icon necessity indicator marks a required field with the resting danger foreground', () => {
	const { root, label } = mountField({ necessityIndicator: 'icon' });
	root.dataset.required = 'true';

	const indicator = getComputedStyle(label, '::after');
	expect(indicator.content).toBe('"*"');
	expect(indicator.color).toBe(resolveColor(root, '--luke-color-foreground-danger-rest'));
});

test('label necessity indicator marks a required field with "(required)" text instead of the asterisk', () => {
	const { root, label } = mountField({ necessityIndicator: 'label' });
	root.dataset.required = 'true';

	const indicator = getComputedStyle(label, '::after');
	expect(indicator.content).toBe('"(required)"');
	// Unlike icon mode, this variant reads as prose rather than a validation cue,
	// so it takes the secondary text colour, not the danger foreground.
	expect(indicator.color).toBe(resolveColor(root, '--luke-color-text-secondary'));
});

test('a non-required field renders neither necessity indicator', () => {
	const { label: iconLabel } = mountField({ necessityIndicator: 'icon' });
	const { label: labelLabel } = mountField({ necessityIndicator: 'label' });

	expect(getComputedStyle(iconLabel, '::after').content).toBe('none');
	expect(getComputedStyle(labelLabel, '::after').content).toBe('none');
});

test('error tone renders the message in the resting danger foreground', () => {
	const { root, message } = mountField({ tone: 'error' });

	expect(getComputedStyle(message).color).toBe(
		resolveColor(root, '--luke-color-foreground-danger-rest'),
	);
});

// `fieldMessageIcon` stays off (`none`) unless a consumer recipe switches it on
// for its own `root` (only `checkbox.css.ts` does; see `checkbox.browser.test.tsx`
// for the on case). TextField/ComboboxField never touch the var, so their error
// message never grows the icon their control already carries.
test('error message icon stays off unless a consumer recipe switches it on', () => {
	const { message } = mountField({ tone: 'error' });

	expect(getComputedStyle(message, '::before').display).toBe('none');
});

// The message container must stay a normal block, never `flex`. `errorMessage` is
// typed `ReactNode` (and RAC's `FieldError` also accepts a render-prop child), so
// it can hold rich content such as `<>text <strong>emphasis</strong> text</>` — a
// `flex` container would turn each top-level child into its own independently-
// wrapping flex item instead of one paragraph. The hanging indent that lines wrapped
// text up under the message text (not the icon) is built from `paddingInlineStart`
// and `textIndent` on an ordinary block for exactly this reason; see
// `checkbox.visual.test.tsx`'s rich-content capture for the regression this guards.
test('error message stays a normal block, never a flex container', () => {
	const { message } = mountField({ tone: 'error' });

	expect(getComputedStyle(message).display).not.toBe('flex');
});

test('disabled field text takes the functional disabled colour, not a role colour', () => {
	const { root, label, message } = mountField({ tone: 'error' });
	root.dataset.disabled = 'true';

	const disabledColor = resolveColor(root, '--luke-color-text-disabled');
	expect(getComputedStyle(label).color).toBe(disabledColor);
	expect(getComputedStyle(message).color).toBe(disabledColor);
	// Disabled must suppress the error tone's danger foreground, not merely add to it.
	expect(getComputedStyle(message).color).not.toBe(
		resolveColor(root, '--luke-color-foreground-danger-rest'),
	);
});

function mountField(options: Parameters<typeof field>[0] = {}) {
	const root = document.body.appendChild(document.createElement('div'));
	root.className = cx(rootClassName, tactileThemeClassName);
	root.dataset.colorMode = 'light';
	mounted.push(root);

	const label = root.appendChild(document.createElement('label'));
	label.className = field(options).label();
	const message = root.appendChild(document.createElement('p'));
	message.className = field(options).message();

	return { root, label, message };
}

function resolveColor(root: HTMLElement, variable: string) {
	const probe = root.appendChild(document.createElement('div'));
	probe.style.color = `var(${variable})`;
	const value = getComputedStyle(probe).color;
	probe.remove();
	return value;
}
