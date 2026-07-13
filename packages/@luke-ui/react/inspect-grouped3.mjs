import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:3001/docs/components/forms/combobox-field', { waitUntil: 'networkidle' });

const inputs = await page.getByRole('combobox', { name: 'Country' }).all();
await inputs[1].scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await inputs[1].click();
await page.waitForTimeout(600);

const info = await page.evaluate(() => {
  const listbox = document.querySelector('[role="listbox"]');
  if (!listbox) return { error: 'still none' };
  const popover = listbox.parentElement;
  const rect = popover.getBoundingClientRect();
  const lbRect = listbox.getBoundingClientRect();
  const cs = getComputedStyle(popover);
  return {
    popoverRect: rect,
    listboxRect: lbRect,
    optionCount: listbox.querySelectorAll('[role="option"]').length,
    groupCount: listbox.querySelectorAll('[role="group"]').length,
    display: cs.display,
    visibility: cs.visibility,
    opacity: cs.opacity,
    position: cs.position,
    insetBlockEnd: cs.insetBlockEnd,
    maxBlockSize: cs.maxBlockSize,
    minBlockSize: cs.minBlockSize,
    transform: cs.transform,
    zIndex: cs.zIndex,
  };
});
console.log(JSON.stringify(info, null, 2));

await page.screenshot({ path: '/tmp/grouped-open.png' });
await browser.close();
