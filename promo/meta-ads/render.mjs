// usage: node render.mjs [a b c d e]   -> out/ad-<id>-4x5.png (1080x1350)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['a', 'b', 'c', 'd', 'e'];
mkdirSync('out', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (const id of ids) {
  await page.goto('file://' + path.resolve('ads.html') + '?ad=' + id);
  await page.waitForFunction(() => window.__ok === true);
  await page.screenshot({ path: `out/ad-${id}-4x5.png`, type: 'png' });
  console.log('ok', id);
}
await browser.close();
