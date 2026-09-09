import { readFile, readdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(path.join(root, file), 'utf8');
const execFileAsync = promisify(execFile);

const [readme, app, styles, optimizedAssets, testDirectory] = await Promise.all([
  read('README.md'),
  read('app.js'),
  read('styles.css'),
  readdir(path.join(root, 'assets/optimized')),
  readdir(path.join(root, 'tests'))
]);

const testFiles = testDirectory
  .filter(file => file.endsWith('.test.cjs'))
  .map(file => path.join(root, 'tests', file));
const { stdout: testOutput } = await execFileAsync(process.execPath, ['--test', ...testFiles], {
  cwd: root,
  env: { ...process.env, NO_COLOR: '1' }
});

const extract = (source, start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const heroBlock = extract(app, 'const heroSlides = [', 'const state =');
const faqBlock = extract(app, 'const faqs = [', 'function faqItems');
const viewsMatch = app.match(/const views = \{([^}]+)\}/s);
const routeCount = viewsMatch ? viewsMatch[1].split(',').length : 0;
const heroCount = (heroBlock.match(/\n\s+id:/g) || []).length;
const faqCount = (faqBlock.match(/\n\s+\['/g) || []).length;
const testCount = Number(testOutput.match(/(?:ℹ|#)\s*tests\s+(\d+)/)?.[1] || 0);
if (!testCount) throw new Error('Unable to determine the passing test count.');
const sourceLines = app.split('\n').length + styles.split('\n').length;
const imageCount = optimizedAssets.filter(file => /\.(?:jpe?g|png|webp|avif)$/i.test(file)).length;
const updatedAt = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'long',
  timeStyle: 'medium',
  timeZone: 'Asia/Kolkata'
}).format(new Date());

const generated = `<!-- AUTO-GENERATED:START -->
| Metric | Current value |
| --- | ---: |
| Storefront routes | ${routeCount} |
| Product flavours | 2 |
| Hero slides | ${heroCount} |
| FAQs | ${faqCount} |
| Automated tests | ${testCount} |
| Optimized production images | ${imageCount} |
| Active JavaScript and CSS lines | ${sourceLines.toLocaleString('en-IN')} |

_README snapshot refreshed on ${updatedAt} IST._
<!-- AUTO-GENERATED:END -->`;

const marker = /<!-- AUTO-GENERATED:START -->[\s\S]*?<!-- AUTO-GENERATED:END -->/;
if (!marker.test(readme)) throw new Error('README auto-generated markers were not found.');

await writeFile(path.join(root, 'README.md'), readme.replace(marker, generated));
console.log('README project snapshot updated.');
