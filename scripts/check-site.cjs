const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const read = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const pages = fs.readdirSync(root, { recursive: true }).filter((f) => f.endsWith('.html') && !f.includes('.git'));
for (const file of pages) {
  const html = read(file);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(?:https?:|mailto:|tel:|data:)/.test(value)) continue;
    const [relative, fragment] = value.split('#');
    let target = relative ? path.resolve(relative.startsWith('/') ? root : path.dirname(path.resolve(file)), relative.split('?')[0].replace(/^\//, '')) : path.resolve(file);
    assert(fs.existsSync(target), `${file}: missing ${value}`);
    if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    assert(fs.existsSync(target), `${file}: missing index ${value}`);
    if (fragment && target.endsWith('.html')) assert(read(target).includes(`id="${fragment}"`), `${file}: missing anchor ${value}`);
  }
  assert.equal((html.match(/data-cf-beacon=/g) || []).length, 1, `${file}: analytics count`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
}
for (const file of ['index.html', 'en/index.html']) {
  const html = read(file), url = `https://robutrace.de/${file === 'index.html' ? '' : 'en/'}`;
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert(html.includes('class="skip-link" href="#main"'));
  assert(html.includes(`rel="canonical" href="${url}"`));
  for (const [lang, target] of [['de', ''], ['en', 'en/'], ['x-default', '']]) assert(html.includes(`hreflang="${lang}" href="https://robutrace.de/${target}"`));
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.deepEqual(graph.map((item) => item['@type']), ['Organization', 'WebSite', 'WebPage']);
  assert.equal(graph[2].url, url);
  assert.equal(graph[2].dateModified, '2026-10-29');
  assert(html.includes('homepage.css?v=20261029'));
  assert(html.includes('virtual-development-cover.png'));
  assert(!html.includes('product-preview.png'));
  // Preserve the working form, privacy wording, anti-spam field and redirect.
  const baseline = cp.execFileSync('git', ['show', `fb832adb3e33bed4bddadd55ba0739ce302c5343:${file}`], { encoding: 'utf8' }).replace(/\r\n/g, '\n');
  assert.equal(html.match(/<form[\s\S]*?<\/form>/)[0], baseline.match(/<form[\s\S]*?<\/form>/)[0], `${file}: form changed`);
}
const protectedFiles = ['impressum.html', 'datenschutz.html', 'en/imprint.html', 'en/privacy.html', 'danke.html', 'en/thank-you.html', 'assets/robutrace-logo-transparent.png', 'assets/robutrace-icon-transparent.png', 'site.js'];
for (const file of protectedFiles) {
  const baseline = cp.execFileSync('git', ['show', `fb832adb3e33bed4bddadd55ba0739ce302c5343:${file}`]);
  const actual = fs.readFileSync(file);
  if (file.endsWith('.html') || file.endsWith('.js')) assert.equal(actual.toString().replace(/\r\n/g, '\n'), baseline.toString().replace(/\r\n/g, '\n'), file);
  else assert(actual.equals(baseline), `${file}: asset changed`);
}
cp.execFileSync('git', ['diff', '--check']);
console.log(`PASS: ${pages.length} pages; internal links/anchors; analytics; JSON-LD; home metadata/languages; unchanged forms, legal pages, scripts and logo.`);
