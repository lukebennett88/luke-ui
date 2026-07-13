import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:3001/docs/components/forms/combobox-field', { waitUntil: 'networkidle' });

// Basic example
const basicInput = page.getByRole('combobox', { name: 'Country' }).first();
await basicInput.click();
await page.waitForTimeout(500);

const popovers = await page.$$('[role="listbox"]');
console.log('listbox count after opening first combobox:', popovers.length);

const info = await page.evaluate(() => {
  const listbox = document.querySelector('[role="listbox"]');
  const popover = listbox?.parentElement;
  if (!popover) return { error: 'no popover found' };

  // Walk ancestor chain checking for containing-block-redefining properties
  const chain = [];
  let el = popover.parentElement;
  while (el) {
    const cs = getComputedStyle(el);
    const relevant = {
      tag: el.tagName,
      cls: el.className?.toString().slice(0, 60),
      transform: cs.transform,
      willChange: cs.willChange,
      filter: cs.filter,
      perspective: cs.perspective,
      contain: cs.contain,
      backdropFilter: cs.backdropFilter,
      position: cs.position,
    };
    const flagged = relevant.transform !== 'none' || relevant.willChange !== 'auto' || relevant.filter !== 'none' || relevant.perspective !== 'none' || (relevant.contain !== 'none' && relevant.contain !== '') || relevant.backdropFilter !== 'none';
    if (flagged) chain.push(relevant);
    el = el.parentElement;
  }

  const rect = popover.getBoundingClientRect();
  const popoverStyle = getComputedStyle(popover);
  return {
    rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height },
    windowInnerHeight: window.innerHeight,
    flaggedAncestors: chain,
    popoverPosition: popoverStyle.position,
    popoverInsetBlockEnd: popoverStyle.insetBlockEnd,
    popoverMaxBlockSize: popoverStyle.maxBlockSize,
    popoverMinBlockSize: popoverStyle.minBlockSize,
    popoverPaddingBlockEnd: popoverStyle.paddingBlockEnd,
    listboxHeight: listbox.getBoundingClientRect(),
    itemCount: listbox.querySelectorAll('[role="option"]').length,
  };
});
console.log(JSON.stringify(info, null, 2));

await page.keyboard.press('Escape');
await page.waitForTimeout(300);

await browser.close();
