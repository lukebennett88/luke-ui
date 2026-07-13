import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:3001/docs/components/forms/combobox-field', { waitUntil: 'networkidle' });

// Find all "Country" comboboxes on the page (basic + grouped examples)
const inputs = await page.getByRole('combobox', { name: 'Country' }).all();
console.log('combobox count on page:', inputs.length);

for (let i = 0; i < inputs.length; i++) {
  await inputs[i].click();
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const listbox = document.querySelector('[role="listbox"]');
    const popover = listbox?.parentElement;
    if (!popover) return { error: 'no popover' };
    const rect = popover.getBoundingClientRect();
    const lbRect = listbox.getBoundingClientRect();
    return {
      popoverRect: { top: rect.top, bottom: rect.bottom, height: rect.height },
      listboxRect: { top: lbRect.top, bottom: lbRect.bottom, height: lbRect.height },
      itemCount: listbox.querySelectorAll('[role="option"], [role="group"]').length,
      optionCount: listbox.querySelectorAll('[role="option"]').length,
      groupCount: listbox.querySelectorAll('[role="group"]').length,
      innerHTML: listbox.innerHTML.slice(0, 500),
    };
  });
  console.log(`--- combobox #${i} ---`);
  console.log(JSON.stringify(info, null, 2));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

await browser.close();
