const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pages = ['privacy.html', 'terms.html'];

for (const page of pages) {
  const source = path.join(root, 'public', page);
  const destination = path.join(root, 'dist', page);
  if (!fs.existsSync(source)) throw new Error(`Pagina pubblica mancante: ${source}`);
  fs.copyFileSync(source, destination);
}

console.log(`Copiate ${pages.length} pagine pubbliche in dist.`);
