// GitHub Pages has no server-side routing. When someone opens or refreshes a deep
// link such as /gitmasteracademy/learn/m03/git-add, Pages serves 404.html. Making
// 404.html a copy of index.html lets the React app boot and route the URL itself.
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const index = resolve(dist, 'index.html');

if (!existsSync(index)) {
  console.error('copy-404: dist/index.html not found. Run vite build first.');
  process.exit(1);
}

copyFileSync(index, resolve(dist, '404.html'));
// Stop GitHub Pages from running Jekyll, which would ignore files starting with "_".
writeFileSync(resolve(dist, '.nojekyll'), '');
console.log('copy-404: wrote dist/404.html and dist/.nojekyll');
