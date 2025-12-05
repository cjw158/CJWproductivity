import pngToIco from 'png-to-ico';
import { writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'src-tauri', 'icons');

async function generateIco() {
  console.log('Generating icon.ico...');
  
  const pngPath = join(iconsDir, 'icon.png');
  const icoPath = join(iconsDir, 'icon.ico');
  
  const icoBuffer = await pngToIco(pngPath);
  writeFileSync(icoPath, icoBuffer);
  
  console.log('✓ Generated icon.ico');
}

generateIco().catch(console.error);
