import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
await page.goto('http://localhost:3001/docs/components/forms/combobox-field', { waitUntil: 'networkidle' });

const inputs = await page.getByRole('combobox', { name: 'Country' }).all();
console.log('combobox count:', inputs.length);

// Just test #1 fresh, no prior interactions
await inputs[1].scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await inputs[1].click();
await page.waitForTimeout(600);

const focused = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 200));
console.log('focused element:', focused);

const listboxes = await page.$$('[role="listbox"]');
console.log('listbox count:', listboxes.length);

const popoverInfo = await page.evaluate(() => {
  // Any popover-ish elements in the DOM at all
  const all = Array.from(document.querySelectorAll('[popover], [data-rac]')).filter(el => el.getAttribute('role') !== 'option');
  return all.slice(0, 10).map(el => ({ tag: el.tagName, role: el.getAttribute('role'), cls: el.className.toString().slice(0,80), rect: el.getBoundingClientRect() }));
});
console.log(JSON.stringify(popoverInfo, null, 2));

await browser.close();
