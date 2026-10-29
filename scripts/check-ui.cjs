const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'robutrace-website-qa-'));
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const lang of ['de', 'en']) for (const width of [1440, 768, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const errors = [], broken = [];
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('response', (res) => { if (res.url().startsWith(origin) && res.status() >= 400) broken.push(res.url()); });
      await page.route('**/*', (route) => route.request().url().startsWith(origin) ? route.continue() : route.abort());
      await page.goto(`${origin}/${lang === 'en' ? 'en/' : ''}`, { waitUntil: 'networkidle' });
      assert(await page.locator('h1').isVisible());
      assert(await page.locator('.home-concept-note').isVisible());
      assert(await page.locator('.home-future').isVisible());
      const overflow = await page.evaluate(() => [...document.querySelectorAll('main *, header *, footer *')].filter((el) => { const rect = el.getBoundingClientRect(); return rect.width && rect.right > innerWidth + 1; }).map((el) => `${el.tagName}.${el.className}`).slice(0, 12));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${lang} ${width}: horizontal overflow ${overflow.join(', ')}`);
      if (width <= 900) {
        const toggle = page.locator('[data-menu-toggle]');
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        await page.locator('.main-nav a[href="#pilot"]').click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        assert.equal(await page.locator('body').evaluate((el) => el.classList.contains('menu-open')), false);
      }
      await page.locator('.home-faq summary').first().click();
      assert.equal(await page.locator('.home-faq details').first().getAttribute('open'), '');
      const contact = lang === 'de' ? 'kontakt' : 'contact';
      await page.locator(`.home-hero .button[href="#${contact}"]`).click();
      assert.equal(new URL(page.url()).hash, `#${contact}`);
      assert.equal(await page.locator('form').evaluate((form) => form.checkValidity()), false);
      assert.equal(await page.locator('form').getAttribute('action'), 'https://form.taxi/s/ak62xooj');
      if (width <= 900) await page.locator('[data-menu-toggle]').click();
      await page.getByRole('link', { name: lang === 'de' ? 'EN' : 'DE', exact: true }).first().click();
      assert.equal(await page.locator('html').getAttribute('lang'), lang === 'de' ? 'en' : 'de');
      await page.goto(`${origin}/${lang === 'en' ? 'en/' : ''}`, { waitUntil: 'networkidle' });
      await page.locator('.founder-photo').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(output, `${lang}-${width}.png`), fullPage: true });
      assert.deepEqual(errors, []); assert.deepEqual(broken, []);
      await page.close();
      console.log(`PASS ${lang} ${width}px: layout, menu, FAQ, contact, validation, language switch, no missing resources or runtime errors.`);
    }
    console.log(`Screenshots: ${output}`);
  } finally { await browser.close(); server.close(); }
})().catch((err) => { console.error(err); server.close(); process.exitCode = 1; });
