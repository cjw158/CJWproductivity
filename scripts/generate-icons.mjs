import sharp from 'sharp';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import toIco from 'to-ico';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectDir = join(__dirname, '..');
const iconsDir = join(projectDir, 'src-tauri', 'icons');
const sourceLogo = join(projectDir, 'Gemini_Generated_Image_8j0gp08j0gp08j0g (1).svg');

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

// 深色背景色 (与应用主题匹配)
const BG_COLOR = { r: 15, g: 15, b: 20, alpha: 1 }; // #0f0f14

async function generateIcons() {
  console.log('Generating icons from:', sourceLogo);
  
  // 生成所有 PNG 尺寸 (带深色背景)
  for (const { name, size } of sizes) {
    const outputPath = join(iconsDir, name);
    
    // 创建深色背景，然后合成 logo
    const background = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BG_COLOR
      }
    }).png().toBuffer();
    
    const logo = await sharp(sourceLogo)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    
    await sharp(background)
      .composite([{ input: logo, blend: 'over' }])
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }
  
  // 生成 ICO (Windows) - 包含多个尺寸 (带深色背景)
  console.log('Generating icon.ico...');
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const icoBuffers = await Promise.all(
    icoSizes.map(async size => {
      const background = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: BG_COLOR
        }
      }).png().toBuffer();
      
      const logo = await sharp(sourceLogo)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      
      return sharp(background)
        .composite([{ input: logo, blend: 'over' }])
        .png()
        .toBuffer();
    })
  );
  const icoBuffer = await toIco(icoBuffers);
  writeFileSync(join(iconsDir, 'icon.ico'), icoBuffer);
  console.log('✓ Generated icon.ico');
  
  // 复制到 public 目录作为 favicon (带深色背景)
  const publicDir = join(projectDir, 'public');
  const bgFavicon = await sharp({
    create: { width: 32, height: 32, channels: 4, background: BG_COLOR }
  }).png().toBuffer();
  const logoFavicon = await sharp(sourceLogo)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp(bgFavicon)
    .composite([{ input: logoFavicon, blend: 'over' }])
    .png()
    .toFile(join(publicDir, 'favicon.png'));
  console.log('✓ Generated public/favicon.png');
  
  console.log('\n✅ All icons generated successfully!');
  console.log('Note: For macOS .icns, use: https://cloudconvert.com/png-to-icns');
}

generateIcons().catch(console.error);
