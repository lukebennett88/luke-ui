import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
await page.goto('http://localhost:3001/docs/components/forms/combobox-field', { waitUntil: 'networkidle' });

const inputs = await page.getByRole('combobox', { name: 'Country' }).all();
console.log('combobox count:', inputs.length);
await inputs[2].scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await inputs[2].click();
await page.waitForTimeout(600);

const info = await page.evaluate(() => {
  const listbox = document.querySelector('[role="listbox"]');
  if (!listbox) return { error: 'no listbox found' };
  const popover = listbox.parentElement;
  const rect = popover.getBoundingClientRect();
  const lbRect = listbox.getBoundingClientRect();
  const cs = getComputedStyle(popover);
  const lbCs = getComputedStyle(listbox);
  return {
    popoverRect: rect,
    listboxRect: lbRect,
    optionCount: listbox.querySelectorAll('[role="option"]').length,
    groupCount: listbox.querySelectorAll('[role="group"]').length,
    groupHeadings: Array.from(listbox.querySelectorAll('[role="group"] > *:first-child')).map(e => e.textContent),
    display: cs.display,
    lbDisplay: lbCs.display,
    lbOverflow: lbCs.overflow,
    lbMaxBlockSize: lbCs.maxBlockSize,
    lbHeight: lbCs.height,
    innerHTML: listbox.innerHTML.slice(0, 1000),
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: '/tmp/grouped-open.png' });
await browser.close();
