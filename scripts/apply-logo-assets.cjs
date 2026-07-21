const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'assets', 'app-prato-new-logo.png');
const targets = [
  'assets/icon.png',
  'assets/favicon.png',
  'assets/ac-prato-crest.png',
  'assets/android-icon-foreground.png',
];

if (!fs.existsSync(source)) throw new Error(`Logo sorgente non trovato: ${source}`);

for (const relativePath of targets) {
  fs.copyFileSync(source, path.join(root, relativePath));
}

console.log(`Applicato il nuovo logo APPrato a ${targets.length} asset.`);
