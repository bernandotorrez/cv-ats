// usage:
//   node render.mjs <index.html> stills <outdir> t1 t2 ...
//   node render.mjs <index.html> video  <out.mp4> [fps] [audio.wav]
//   node render.mjs <index.html> frames <outdir> <fps> <start> <end>   (run several in parallel, then encode with ffmpeg)
// "video" pipes frames straight into ffmpeg (no PNG sequence on disk).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const [html, mode, out, ...rest] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const [htmlFile, htmlQuery = ''] = html.split('?');
await page.goto('file://' + path.resolve(htmlFile) + '?render=1' + (htmlQuery ? '&' + htmlQuery : ''));
await page.waitForFunction(() => window.__ready === true);
// a page can declare its own frame size (e.g. the 9:16 cut sets window.__size = [1080, 1920])
const [vw, vh] = await page.evaluate(() => window.__size || [1920, 1080]);
if (vw !== 1920 || vh !== 1080) await page.setViewportSize({ width: vw, height: vh });
const DUR = Number(process.env.DUR || (await page.evaluate(() => window.__dur)) || 50);

const frame = async (t, opts = {}) => {
  await page.evaluate((tt) => window.render(tt), t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  return page.screenshot({ type: 'png', ...opts });
};

if (mode === 'stills') {
  mkdirSync(out, { recursive: true });
  for (const t of rest.map(Number)) await frame(t, { path: path.join(out, `t${t.toFixed(2)}.png`) });
} else if (mode === 'frames') {
  // one slice of a parallel render: frames [start, end) → <outdir>/f0000.png ...
  mkdirSync(out, { recursive: true });
  const [fps, start, end] = rest.map(Number);
  for (let i = start; i < end; i++) {
    await frame(i / fps, { path: path.join(out, `f${String(i).padStart(4, '0')}.png`) });
    if ((i - start) % 40 === 0) console.log(`slice ${start}: ${i - start}/${end - start}`);
  }
} else {
  const fps = Number(rest[0] || 30);
  const audio = rest[1];
  const n = Math.round(DUR * fps);
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
  if (audio) args.push('-i', audio);
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  if (audio) args.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  args.push(out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await frame(i / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await done;
}
await browser.close();
