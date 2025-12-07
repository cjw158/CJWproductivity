import sharp from 'sharp';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import toIco from 'to-ico';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectDir = join(__dirname, '..', 'CJWproductivity-main');
const iconsDir = join(projectDir, 'src-tauri', 'icons');
// 圆形透明背景 Logo
const sourceLogo = join(projectDir, '微信图片_20251207114224.png');

// 所有需要生成的图标尺寸
const sizes = [
  { name: '32x32.png', size: 32 },
  { name: '64x64.png', size: 64 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
  { name: 'icon.png', size: 512 },
  { name: 'Square30x30Logo.png', size: 30 },
  { name: 'Square44x44Logo.png', size: 44 },
  { name: 'Square71x71Logo.png', size: 71 },
  { name: 'Square89x89Logo.png', size: 89 },
  { name: 'Square107x107Logo.png', size: 107 },
  { name: 'Square142x142Logo.png', size: 142 },
  { name: 'Square150x150Logo.png', size: 150 },
  { name: 'Square284x284Logo.png', size: 284 },
  { name: 'Square310x310Logo.png', size: 310 },
  { name: 'StoreLogo.png', size: 50 },
];

async function generateIcons() {
  console.log('Generating icons from:', sourceLogo);
  console.log('Using circular transparent logo...\n');
  
  // 生成所有 PNG 尺寸（保持透明背景）
  for (const { name, size } of sizes) {
    const outputPath = join(iconsDir, name);
    
    await sharp(sourceLogo)
      .resize(size, size, { 
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },  // 透明背景
        kernel: sharp.kernel.lanczos3  // 高质量缩放算法
      })
      .png({ 
        compressionLevel: 9,  // 最大压缩但无损
        palette: false        // 不使用调色板，保持真彩色
      })
      .toFile(outputPath);
    
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }
  
  // 生成 ICO (Windows) - 包含多个尺寸（保持透明）
  console.log('\nGenerating icon.ico...');
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const icoBuffers = await Promise.all(
    icoSizes.map(async size => {
      return sharp(sourceLogo)
        .resize(size, size, { 
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
          kernel: sharp.kernel.lanczos3
        })
        .png({ compressionLevel: 9, palette: false })
        .toBuffer();
    })
  );
  const icoBuffer = await toIco(icoBuffers);
  writeFileSync(join(iconsDir, 'icon.ico'), icoBuffer);
  console.log('✓ Generated icon.ico (multi-size: 16-256px)');
  
  // 复制到 public 目录
  const publicDir = join(projectDir, 'public');
  
  // 启动动画 Logo (512px)
  await sharp(sourceLogo)
    .resize(512, 512, { 
      fit: 'contain', 
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3 
    })
    .png({ compressionLevel: 9, palette: false })
    .toFile(join(publicDir, 'logo.png'));
  console.log('✓ Generated public/logo.png (启动动画)');
  
  // Favicon (32px)
  await sharp(sourceLogo)
    .resize(32, 32, { 
      fit: 'contain', 
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3 
    })
    .png({ compressionLevel: 9, palette: false })
    .toFile(join(publicDir, 'favicon.png'));
  console.log('✓ Generated public/favicon.png');
  
  console.log('\n✅ All icons generated successfully!');
  console.log('Source: 微信图片_20251207114224.png (圆形透明 Logo)');
  console.log('Note: For macOS .icns, use: https://cloudconvert.com/png-to-icns');
}

generateIcons().catch(console.error);
