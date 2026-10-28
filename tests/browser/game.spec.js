import { test, expect } from '@playwright/test';
import { newGame, getEvent, SAVE_KEY } from '../../src/engine.js';
const snapshot = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
const start = async (page, s = newGame('coder', 42)) => {
  await page.goto('/'); await page.locator('[data-ui="start"]').waitFor(); await page.evaluate(({ key, s }) => localStorage.setItem(key, JSON.stringify(s)), { key: SAVE_KEY, s });
  await page.reload(); await page.locator('[data-ui="resume"]').click();
};
const choose = async page => {
  const s = await snapshot(page), e = getEvent(s); if (!e) return;
  const index = e.options.map((o, i) => ({ o, i })).filter(({ o }) => s.cash + (o.effects.cash ?? 0) >= 0).sort((a, b) => score(b.o) - score(a.o))[0].i;
  await page.locator(`[data-ui="choose"][data-index="${index}"]`).click();
};
const score = o => (o.effects.cash ?? 0) / 130 + (o.effects.health ?? 0) * 1.5 - (o.effects.stress ?? 0) * 1.5 + (o.effects.skill ?? 0) * .7 + (o.effects.reputation ?? 0) * .7 - (o.effects.techDebt ?? 0) * .5;

test('desktop: real 40-day UI run, trades, model contract, save/resume and PNG export', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 }); await start(page); await choose(page);
  await page.getByRole('button', { name: '买入祖传提示词', exact: true }).click();
  await page.locator('#quantity').fill('2'); await page.locator('#trade-submit').click();
  expect((await snapshot(page)).inventory.prompt.qty).toBe(2);
  await page.getByRole('button', { name: '卖出祖传提示词', exact: true }).click();
  await page.locator('#quantity-max').click(); await page.locator('#trade-submit').click();
  expect((await snapshot(page)).inventory.prompt.qty).toBe(0);
  await page.locator('.menu [data-ui="models"]').click(); await page.locator('#model-search').fill('DeepSeek');
  await expect(page.locator('.model-card')).toHaveCount(1); await page.locator('[data-ui="hire-model"]').click();
  expect((await snapshot(page)).model).toContain('deepseek');
  for (let day = 1; day <= 40; day++) {
    const current = await snapshot(page); expect(current.day).toBe(day); expect(current.status).toBe('playing');
    if (day === 3 || day === 4 || day === 12) await page.screenshot({ path: `evidence/day-${day}-desktop.png`, fullPage: true });
    if (day === 4) { await page.locator('#stance').fill('95'); await expect(page.locator('#stance-name')).toHaveText('义父'); }
    await choose(page);
    for (let n = 0; n < 2; n++) { const s = await snapshot(page); await page.locator(`[data-ui="action"][data-id="${s.health < 70 || s.stress > 35 ? 'rest' : 'work'}"]`).click(); }
    const s = await snapshot(page), payment = Math.min(s.debt, Math.max(0, s.cash - 800));
    if (payment) { await page.locator('[data-ui="finance"]').click(); await page.locator('#repayment').fill(String(payment)); await page.locator('#repay').click(); }
    if (day === 10) { const before = await snapshot(page); await page.reload(); await page.locator('[data-ui="resume"]').click(); expect(await snapshot(page)).toEqual(before); }
    if (day < 40) await page.locator('[data-ui="travel"][data-id="jobs"]').click();
  }
  await page.locator('[data-ui="finish"]').click(); await page.locator('#confirm-finish').click();
  const final = await snapshot(page); expect(final.day).toBe(40); expect(final.status).toBe('ended'); expect(final.debt).toBe(0);
  await expect(page.locator('.ending-receipt')).toBeVisible();
  const download = page.waitForEvent('download'); await page.locator('[data-ui="result-image"]').click();
  const file = await download; expect(file.suggestedFilename()).toMatch(/\.png$/); await file.saveAs('evidence/ending-card.png');
  await page.screenshot({ path: 'evidence/ending-desktop.png', fullPage: true }); expect(errors).toEqual([]);
});

test('mobile: complete run and gallery/source/model dialogs at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await start(page, newGame('worker', 91));
  for (let day = 1; day <= 40; day++) {
    const s = await snapshot(page); expect(s.day).toBe(day); expect(s.status).toBe('playing');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    if (day === 3) {
      await page.screenshot({ path: 'evidence/day-3-mobile.png', fullPage: true });
      await page.locator('.menu [data-ui="gallery"]').click(); await page.locator('#modal [data-ui="meme-detail"][data-id="fish-rice"]').click();
      await expect(page.locator('.source-link')).toHaveAttribute('href', /aigengtu/); await page.locator('.window-close[data-ui="close-modal"]').click();
    }
    await choose(page);
    for (let i = 0; i < 2; i++) { const n = await snapshot(page); await page.locator(`[data-ui="action"][data-id="${n.health < 70 || n.stress > 35 ? 'rest' : 'work'}"]`).click(); }
    if (day < 40) await page.locator('[data-ui="travel"][data-id="jobs"]').click();
  }
  await page.locator('[data-ui="finish"]').click(); await page.locator('#confirm-finish').click(); await expect(page.locator('.ending-receipt')).toBeVisible();
  await page.locator('.menu [data-ui="models"]').click(); await page.locator('#model-region').selectOption('国内'); await page.locator('#model-search').fill('豆包');
  await expect(page.locator('.model-card')).toHaveCount(1);
  await page.screenshot({ path: 'evidence/models-mobile.png', fullPage: true });
});

test('320px layout, keyboard modal, malformed import and storage failure', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 }); await start(page); await choose(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.keyboard.press('F2'); await expect(page.locator('.boss-sheet')).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.locator('#modal')).not.toBeVisible();
  const before = await snapshot(page); await page.locator('[data-ui="save"]').click();
  await page.locator('#import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"cash":999999}') });
  await expect(page.locator('#toast')).toContainText('格式不正确'); expect(await snapshot(page)).toEqual(before);
  await page.keyboard.press('Escape');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await page.locator('[data-ui="action"][data-id="work"]').click(); await expect(page.locator('.save-warning')).toContainText('自动存档失败');
});

test('offline resume, valid save import, support and follow images', async ({ page, context }) => {
  await start(page); await choose(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.locator('[data-ui="resume"]').click();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const before = await snapshot(page); await context.setOffline(true);
  await page.reload(); await page.locator('[data-ui="resume"]').click(); expect(await snapshot(page)).toEqual(before);
  await page.locator('[data-ui="action"][data-id="work"]').click(); expect((await snapshot(page)).cash).toBeGreaterThan(before.cash);
  await context.setOffline(false);
  await page.locator('[data-ui="save"]').click();
  await page.locator('#import-file').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(before)) });
  await page.locator('#confirm-import').click(); expect(await snapshot(page)).toEqual(before);
  for (const id of ['support','follow']) {
    await page.locator(`[data-ui="${id}"]`).click(); await expect(page.locator('.community-qr')).toBeVisible();
    await expect.poll(() => page.locator('.community-qr').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
  }
});
