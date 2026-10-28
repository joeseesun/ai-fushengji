import { test, expect } from '@playwright/test';
import { newGame, getEvent, SAVE_KEY } from '../../src/engine.js';
const snapshot = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
const start = async (page, s = newGame('coder', 42)) => {
  await page.goto('/'); await page.locator('[data-ui="start"]').waitFor(); await page.evaluate(({ key, s }) => localStorage.setItem(key, JSON.stringify(s)), { key: SAVE_KEY, s });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth), 'saved welcome fits the viewport').toBe(true);
  await page.locator('[data-ui="resume"]').click();
};
// Encounters are read-only since v0.9; the only pick left in that panel is the perk draft.
const choose = async page => {
  if ((await snapshot(page)).draft) { await showPane(page, 'event'); await page.locator('[data-ui="perk"]').first().click(); }
};
const reveal = async (page, selector, frame = '.event-pages') => {
  if (frame === '.event-pages') await showPane(page, 'event');
  for (let i = 0; i < 12; i++) {
    if (await page.locator(selector).isVisible()) return;
    const next = page.locator(`${frame} [data-page-turn="1"]`);
    if (!await next.isVisible() || !await next.isEnabled()) throw new Error(`Cannot reveal ${selector}`);
    await next.click();
  }
};
const showPane = async (page, id) => {
  const tab = page.locator(`.pane-tabs [data-pane="${id}"]`);
  if (await tab.isVisible()) await tab.click();
};
const settleBosses = async page => {
  const before = await snapshot(page);
  if (before.draft) { await showPane(page, 'event'); await page.locator('[data-ui="perk"]').first().click(); expect((await snapshot(page)).perks.length).toBe(before.perks.length + 1); }
  const s = await snapshot(page);
  if (s.rent && !s.rent.paid && s.cash >= s.rent.due) { await page.locator('[data-ui="rent"]').click(); expect((await snapshot(page)).rent.paid).toBe(true); }
};
const endDay = async page => {
  await settleBosses(page);
  await page.locator('[data-ui="map"]').click();
  await page.locator('.map-pin[data-id="jobs"]').click();
  const go = page.locator('[data-ui="map-go"]'); await expect(go).toBeInViewport(); await go.click();
  await page.locator('[data-ui="end-day"]').click();
  const confirm = page.locator('#confirm-travel'); if (await confirm.isVisible()) await confirm.click();
  const start = page.locator('dialog.briefing [data-ui="close-modal"].cta');
  await expect(start).toBeVisible(); await expect(start).toBeInViewport({ ratio: 1 }); await start.click();
};
const doAction = async (page, id) => {
  await showPane(page, 'actions');
  await reveal(page, `[data-ui="action"][data-id="${id}"]`, '.action-pages');
  await page.locator(`[data-ui="action"][data-id="${id}"]`).click();
  const button = page.locator('#act-continue');
  await button.click(); if (await button.isVisible()) await button.click();
  await expect(page.locator('#modal')).not.toBeVisible();
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
    await choose(page);
    for (let n = 0; n < 2; n++) { const s = await snapshot(page); await doAction(page, s.health < 70 || s.stress > 35 ? 'rest' : 'work'); }
    const s = await snapshot(page), payment = Math.min(s.debt, Math.max(0, s.cash - 800));
    if (payment) { await page.locator('[data-ui="finance"]').click(); await page.locator('#repayment').fill(String(payment)); await page.locator('#repay').click(); }
    if (day === 10) { const before = await snapshot(page); await page.reload(); await page.locator('[data-ui="resume"]').click(); expect(await snapshot(page)).toEqual(before); }
    if (day < 40) await endDay(page);
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
      await page.locator('.menu [data-ui="gallery"]').click(); await reveal(page, '#modal [data-ui="meme-detail"][data-id="fish-rice"]', '#modal .page-frame'); await page.locator('#modal [data-ui="meme-detail"][data-id="fish-rice"]').click();
      await expect(page.locator('.source-link')).toHaveAttribute('href', /aigengtu/); await page.locator('.window-close[data-ui="close-modal"]').click();
    }
    await choose(page);
    for (let i = 0; i < 2; i++) { const n = await snapshot(page); await doAction(page, n.health < 70 || n.stress > 35 ? 'rest' : 'work'); }
    if (day < 40) await endDay(page);
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
  await doAction(page, 'work'); await expect(page.locator('.save-warning')).toContainText('自动存档失败');
});

test('offline resume, valid save import, support and follow images', async ({ page, context }) => {
  await start(page); await choose(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.locator('[data-ui="resume"]').click();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const before = await snapshot(page); await context.setOffline(true);
  await page.reload(); await page.locator('[data-ui="resume"]').click(); expect(await snapshot(page)).toEqual(before);
  await doAction(page, 'work'); expect((await snapshot(page)).cash).toBeGreaterThan(before.cash);
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

test('single screen: VIPs, items and the day\'s meme are readable by buttons, without scrolling or clipping', async ({ page }) => {
  const sizes = [[1365,768], [1440,900], [1024,768], [390,844], [320,568], [844,390], [683,384]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const id of ['rheostat', 'fish-rice', 'router-launch', 'gpu-oom', 'budget', 'claude-ban']) {
      const s = newGame('coder', 42); s.day = 20; s.event = id; s.seen.push(id);
      await start(page, s); await showPane(page, 'event');
      let sawMeme = false;
      for (let n = 0; n < 15; n++) {
        const geometry = await page.evaluate(() => {
          const issues = [];
          for (const frame of document.querySelectorAll('.page-frame')) {
            if (!frame.getClientRects().length) continue;
            const content = frame.querySelector('.page-content'), bounds = content.getBoundingClientRect();
            for (const child of content.children) {
              if (child.hidden) continue;
              const r = child.getBoundingClientRect();
              if (r.bottom > bounds.bottom + 1 || r.right > bounds.right + 1 || r.left < bounds.left - 1) issues.push(child.textContent.slice(0,60));
            }
          }
          const end = document.querySelector('.end-day-button').getBoundingClientRect();
          return { issues, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, end: end.bottom };
        });
        expect(geometry.issues, `${width}x${height} ${id}`).toEqual([]);
        expect(geometry.width).toBeLessThanOrEqual(width); expect(geometry.height).toBeLessThanOrEqual(height);
        expect(geometry.end).toBeLessThanOrEqual(height);
        if (await page.locator('.today-meme h3:visible').count()) sawMeme = true;
        expect(await page.locator('[data-ui="choose"]').count()).toBe(0);
        const next = page.locator('.event-pages [data-page-turn="1"]');
        if (!await next.isVisible() || !await next.isEnabled()) break;
        await next.click();
      }
      expect(sawMeme, `${width}x${height} ${id}`).toBe(true);
      for (const pane of ['market','actions']) { await showPane(page, pane); expect(await page.evaluate(() => [scrollX,scrollY])).toEqual([0,0]); }
    }
  }
});

test('guidance starts with actions while encounters remain optional', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 }); await start(page);
  await expect(page.locator('#next-step')).toContainText('看大佬在哪');
  await choose(page);
  await expect(page.locator('.game-content')).toHaveAttribute('data-active-pane','actions');
  await expect(page.locator('#next-step')).toContainText('今天选 2 件事');
  await expect(page.locator('[data-ui="action"][data-id="work"]')).toBeEnabled();
  await doAction(page, 'work');
  await expect(page.locator('#next-step')).toContainText('今天选 1 件事');
  await doAction(page, 'rest');
  await expect(page.locator('#next-step')).toContainText('可以收工');
  await expect(page.locator('.end-day-button')).toHaveClass(/cta/);
  await showPane(page,'market');
  await expect(page.locator('[data-ui="buy"][data-id="prompt"]')).toBeEnabled();
  await endDay(page);
  await expect(page.locator('[data-testid="day"]')).toHaveText('02');
  await expect(page.locator('.game-content')).toHaveAttribute('data-active-pane','actions');
  await expect(page.locator('#next-step')).toContainText('看大佬在哪');
});

test('identity picker starts the chosen role; writing shows a gacha card', async ({ page }) => {
  for (const [width, height] of [[1365, 768], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height }); await page.goto('/'); await page.evaluate(() => localStorage.clear()); await page.reload();
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth), `${width}x${height}`).toBe(true);
    await page.locator('.role-tab[data-id="creator"]').click();
    await expect(page.locator('.role-card h3')).toHaveText('AI 自媒体');
    await expect(page.locator('.start-button')).toHaveClass(/cta/); await expect(page.locator('.start-button')).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: `evidence/welcome-${width}.png` });
  }
  await page.setViewportSize({ width: 1365, height: 768 });
  await page.locator('.start-button').click();
  expect((await snapshot(page)).role).toBe('creator');
  await choose(page);
  await expect(page.locator('[data-ui="action"][data-id="write"]')).toHaveClass(/suggested/);
  await page.locator('[data-ui="action"][data-id="write"]').click();
  await expect(page.locator('.act-progress')).toBeVisible();
  await expect(page.locator('.gacha-rank')).toBeVisible(); await expect(page.locator('#modal .cta')).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: 'evidence/gacha-desktop.png' });
  await page.locator('#act-continue').click(); await expect(page.locator('#modal')).not.toBeVisible();
  await expect(page.locator('.stat[data-stat="health"] .float-num')).toBeVisible();
});

// Check the actual content box, not just the page root: overflow hidden can mask clipping.
const readPages = async (page, frameSelector) => {
  const seen = new Set();
  const frame = page.locator(frameSelector);
  const count = await frame.locator(':scope > .page-content > *').count();
  for (let i = 0; i < 45; i++) {
    const measured = await frame.evaluate(frame => {
      const box = frame.querySelector(':scope > .page-content'), r = box.getBoundingClientRect();
      const seen = [], clipped = [];
      [...box.children].forEach((child, index) => {
        if (child.hidden) return;
        seen.push(index); const c = child.getBoundingClientRect();
        if (c.bottom > r.bottom + 1 || c.right > r.right + 1 || c.top < r.top - 1 || c.left < r.left - 1) clipped.push(child.textContent.slice(0, 70));
      });
      return { seen, clipped };
    });
    expect(measured.clipped, `${frameSelector} ${JSON.stringify(page.viewportSize())}`).toEqual([]);
    measured.seen.forEach(n => seen.add(n));
    const next = frame.locator(':scope > .page-controls [data-page-turn="1"]');
    if (!await next.isVisible() || !await next.isEnabled()) break;
    await next.click();
  }
  expect(seen.size, `${frameSelector}: every block reachable`).toBe(count);
};

test('news survives refresh, explains prices, and all small-screen copy is reachable', async ({ page }) => {
  const { NEWS_EDITIONS } = await import('../../src/news.js');
  for (const [width,height] of [[1365,768],[390,844],[320,568],[683,384]]) {
    await page.setViewportSize({width,height});
    const s = newGame('coder',42); s.event=null; s.rumor=null;
    const edition = NEWS_EDITIONS.find(e => e.id === 'tokens-claw');
    s.news=edition.topic; s.newsEdition=edition.id; s.newsSeen=[edition.id];
    await start(page,s);
    await expect(page.locator('.news-ticker')).toContainText(edition.title);
    await page.locator('[data-ui="news"]:visible').first().click();
    await expect(page.locator('.news-headline')).toHaveText(edition.title);
    await readPages(page,'#modal .page-frame');
    await expect(page.locator('#modal .news-market-line').filter({hasText:'H200'})).toContainText('×1.7');
    expect(await page.locator('#modal .source-link').getAttribute('href')).toContain('bilibili.com');
    await page.screenshot({path:`evidence/news-${width}.png`});
    await page.keyboard.press('Escape');
    const before=await snapshot(page); await page.reload(); await page.locator('[data-ui="resume"]').click();
    expect(await snapshot(page)).toEqual(before);
    await expect(page.locator('.news-ticker')).toContainText(edition.title);
  }
});

test('Claw and Token loan stories stay readable as the day\'s meme on small screens', async ({ page }) => {
  for (const [width,height] of [[1365,768],[390,844],[320,568],[683,384]]) {
    await page.setViewportSize({width,height});
    for(const id of ['claw-mini','token-loan','claw-token-bill','claw-budget-win','claw-credit-after']) {
      const s=newGame('coder',42);s.day=25;s.event=id;s.seen.push(id);
      await start(page,s); await readPages(page,'.event-pages');
    }
  }
  await showPane(page, 'event'); expect(await page.locator('[data-ui="choose"]').count()).toBe(0);
});

test('map cancel keeps destination; map, models and achievements use buttons without scroll', async ({ page }) => {
  for(const [width,height] of [[1365,768],[390,844],[320,568],[683,384]]) {
    await page.setViewportSize({width,height});
    const s=newGame('coder',42);s.event=null;s.ap=0;await start(page,s);
    await page.locator('[data-ui="map"]').click();await page.locator('.map-pin[data-id="home"]').click();
    await page.getByRole('button',{name:'再想想',exact:true}).click();
    await expect(page.locator('.map-button b')).toContainText('大厂发布会');
    await page.locator('[data-ui="end-day"]').click();expect((await snapshot(page)).location).toBe('launch');
    await page.keyboard.press('Escape');
    // Return to an event-free fixture to inspect every panel independently.
    await start(page,s);
    for(const panel of ['map','models','achievements']) {
      if (panel === 'achievements') { await page.locator('.menu [data-ui="leaderboard"]').click(); await page.locator('#modal [data-ui="achievements"]').click(); }
      else await page.locator(`[data-ui="${panel}"]`).first().click();
      await page.locator('dialog[open]').waitFor();
      await page.evaluate(()=>Promise.all([...document.querySelectorAll('dialog img')].map(i=>i.decode().catch(()=>{}))));
      await readPages(page,'#modal .page-frame');
      const scrolling=await page.locator('#modal .modal-content').evaluate(el=>({x:el.scrollWidth>el.clientWidth+1,y:el.scrollHeight>el.clientHeight+1}));
      expect(scrolling,`${panel} ${width}x${height}`).toEqual({x:false,y:false});
      if(panel==='map') await expect(page.locator('[data-ui="map-go"]')).toBeInViewport({ratio:1});
      await page.keyboard.press('Escape');
    }
  }
});
