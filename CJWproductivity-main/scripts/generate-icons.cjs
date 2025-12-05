/**
 * 生成 CJW 紧凑胶囊 Logo 图标
 * 运行: node scripts/generate-icons.cjs
 */

const fs = require('fs');
const path = require('path');

// 通用 SVG 生成函数
function createSVG(width, height) {
  const strokeWidth = height * 0.06;
  const rectWidth = width - strokeWidth * 2;
  const rectHeight = height - strokeWidth * 2;
  const radius = rectHeight / 2; // 完全半圆形成胶囊
  const fontSize = rectHeight * 0.58; // 文字填满高度

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a" />
      <stop offset="100%" style="stop-color:#1e293b" />
    </linearGradient>
    <linearGradient id="stroke" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22d3ee" />
      <stop offset="100%" style="stop-color:#a855f7" />
    </linearGradient>
  </defs>
  
  <rect 
    x="${strokeWidth}" 
    y="${strokeWidth}" 
    width="${rectWidth}" 
    height="${rectHeight}" 
    rx="${radius}" 
    ry="${radius}" 
    fill="url(#bg)" 
    stroke="url(#stroke)" 
    stroke-width="${strokeWidth}"
  />
  
  <text 
    x="50%" 
    y="54%" 
    dominant-baseline="central" 
    text-anchor="middle" 
    font-family="Arial, sans-serif" 
    font-weight="900" 
    font-size="${fontSize}" 
    fill="white"
  >CJW</text>
</svg>`;
}

// 写入 SVG 文件
const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');

// 生成紧凑胶囊 logo (2:1 比例)
const logoSvg = createSVG(200, 100);
fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSvg);
console.log('✓ 生成 public/logo.svg (紧凑胶囊 200x100)');

// 生成应用图标 (正方形，内嵌紧凑胶囊)
function createSquareIcon(size) {
  const capsuleWidth = size * 0.9;
  const capsuleHeight = size * 0.45;
  const strokeWidth = capsuleHeight * 0.06;
  const rectWidth = capsuleWidth - strokeWidth * 2;
  const rectHeight = capsuleHeight - strokeWidth * 2;
  const radius = rectHeight / 2;
  const fontSize = rectHeight * 0.58;
  const xOffset = (size - capsuleWidth) / 2 + strokeWidth;
  const yOffset = (size - capsuleHeight) / 2 + strokeWidth;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a" />
      <stop offset="100%" style="stop-color:#1e293b" />
    </linearGradient>
    <linearGradient id="stroke" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22d3ee" />
      <stop offset="100%" style="stop-color:#a855f7" />
    </linearGradient>
  </defs>
  
  <rect 
    x="${xOffset}" 
    y="${yOffset}" 
    width="${rectWidth}" 
    height="${rectHeight}" 
    rx="${radius}" 
    ry="${radius}" 
    fill="url(#bg)" 
    stroke="url(#stroke)" 
    stroke-width="${strokeWidth}"
  />
  
  <text 
    x="50%" 
    y="50%" 
    dominant-baseline="central" 
    text-anchor="middle" 
    font-family="Arial, sans-serif" 
    font-weight="900" 
    font-size="${fontSize}" 
    fill="white"
  >CJW</text>
</svg>`;
}

const iconSvg = createSquareIcon(512);
fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg);
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), iconSvg);
console.log('✓ 生成 icon.svg (512x512 正方形内嵌胶囊)');

console.log('\n完成！请运行 "npm run tauri icon src-tauri/icons/icon.svg" 生成所有平台图标。');
