import { access, cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const requiredFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'assets/aura-whey-logo.jpeg',
  'assets/optimized/hero-combo-960.jpg',
  'assets/optimized/hero-combo-1920.jpg'
];

await Promise.all(requiredFiles.map(file => access(path.join(root, file))));
await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'assets'), { recursive: true });

await Promise.all([
  cp(path.join(root, 'index.html'), path.join(output, 'index.html')),
  cp(path.join(root, 'styles.css'), path.join(output, 'styles.css')),
  cp(path.join(root, 'app.js'), path.join(output, 'app.js')),
  cp(path.join(root, 'assets/aura-whey-logo.jpeg'), path.join(output, 'assets/aura-whey-logo.jpeg')),
  cp(path.join(root, 'assets/optimized'), path.join(output, 'assets/optimized'), { recursive: true })
]);

console.log(`Built static storefront at ${output}`);
