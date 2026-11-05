import { chromium, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve('dist/build/h5');
const out = path.resolve(process.env.KB_UI_EVIDENCE_DIR || 'test-results');
await mkdir(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.pdf': 'application/pdf', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, acceptDownloads: true });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(url);
    await expect(page.getByText('教学资料，从这里开始。')).toBeVisible();
    await expect(page.getByText('答案示例：已启用红色答案', { exact: true })).toBeHidden();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal overflow');
    await page.locator('uni-button').filter({ hasText: '查看配置预览' }).click();
    await expect(page.getByText('请填写预览标题', { exact: true })).toBeVisible();
    const input = page.locator('.u-input input');
    await input.fill('初始化验证');
    await page.locator('uni-button').filter({ hasText: '查看配置预览' }).click();
    const answer = page.getByText('答案示例：已启用红色答案', { exact: true });
    await expect(answer).toBeVisible();
    assert.equal(await answer.evaluate(el => getComputedStyle(el).color), 'rgb(211, 47, 47)');
    await expect.poll(() => answer.evaluate(el => {
      let opacity = 1;
      for (let node = el; node; node = node.parentElement) opacity = Math.min(opacity, Number(getComputedStyle(node).opacity));
      return opacity;
    })).toBe(1);
    await page.screenshot({ path: path.join(out, `answer-${viewport.width}.png`), fullPage: true });
    await page.locator('uni-button').filter({ hasText: '返回调整' }).click();
    await expect(answer).toBeHidden();
    await page.locator('.u-switch').click();
    await page.locator('uni-button').filter({ hasText: '查看配置预览' }).click();
    await expect(page.getByText('学生版不显示答案内容', { exact: true })).toBeVisible();
    await expect(answer).toHaveCount(0);
    await page.locator('uni-button').filter({ hasText: '返回调整' }).click();
    await page.getByText('预览说明与返回验证 →', { exact: true }).click();
    await expect(page.getByText('基础预览说明', { exact: true })).toBeVisible();
    await page.locator('uni-button').filter({ hasText: '返回基础预览' }).click();
    await expect(input).toHaveValue('初始化验证');
    await page.getByLabel('选择本机文件').setInputFiles({ name: 'invalid.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a pdf') });
    await expect(page.getByText('请选择有效的 PDF、PNG、JPG 或 GIF 文件')).toBeVisible();
    await page.getByLabel('选择本机文件').setInputFiles('src/static/preview-sample.pdf');
    await expect(page.locator('iframe[title="本机 PDF 预览"]')).toBeVisible();
    await page.screenshot({ path: path.join(out, `pdf-${viewport.width}.png`), fullPage: true });
    const downloaded = page.waitForEvent('download');
    await page.getByText('下载所选文件', { exact: true }).click();
    const download = await downloaded;
    const bytes = await readFile(await download.path());
    assert.deepEqual(bytes, await readFile('src/static/preview-sample.pdf'));
    await page.getByLabel('移除文件').click();
    await expect(page.locator('iframe')).toHaveCount(0);
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jE8sAAAAASUVORK5CYII=', 'base64');
    await page.getByLabel('选择本机文件').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png });
    await expect(page.getByAltText('所选本机图片')).toBeVisible();
    await page.getByLabel('移除文件').click();
    const pdf = await context.request.get(new URL('static/preview-sample.pdf', url).href);
    assert.equal(pdf.headers()['content-type'], 'application/pdf');
    assert.equal((await pdf.body()).subarray(0, 5).toString(), '%PDF-');
    await page.screenshot({ path: path.join(out, `home-${viewport.width}.png`), fullPage: true });
    await page.reload();
    await expect(input).toHaveValue('');
    assert.deepEqual(errors, [], 'browser console and runtime');
    report.push({ viewport, result: 'passed', checks: ['required input', 'answer popup and red color', 'student answer removal', 'route return and state', 'invalid file', 'PDF preview and byte-identical download', 'image preview', 'no overflow', 'refresh clears draft', 'no browser errors'] });
    await context.close();
  }
  await writeFile(path.join(out, 'ui-report.json'), JSON.stringify({ at: new Date().toISOString(), target: 'production build, Chromium desktop and mobile viewport', report }, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
