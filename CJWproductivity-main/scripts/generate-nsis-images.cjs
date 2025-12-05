/**
 * 生成 NSIS 安装包所需的 BMP 图片
 * 运行: node scripts/generate-nsis-images.js
 */

const fs = require('fs');
const path = require('path');

// BMP 文件头生成函数
function createBMP(width, height, colorFunc) {
  const rowSize = Math.ceil((width * 3) / 4) * 4; // 每行必须是4字节对齐
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  
  const buffer = Buffer.alloc(fileSize);
  
  // BMP 文件头 (14 bytes)
  buffer.write('BM', 0);                      // 签名
  buffer.writeUInt32LE(fileSize, 2);          // 文件大小
  buffer.writeUInt32LE(0, 6);                 // 保留
  buffer.writeUInt32LE(54, 10);               // 像素数据偏移
  
  // DIB 头 (40 bytes)
  buffer.writeUInt32LE(40, 14);               // DIB 头大小
  buffer.writeInt32LE(width, 18);             // 宽度
  buffer.writeInt32LE(height, 22);            // 高度 (正数=底部向上)
  buffer.writeUInt16LE(1, 26);                // 颜色平面数
  buffer.writeUInt16LE(24, 28);               // 每像素位数
  buffer.writeUInt32LE(0, 30);                // 压缩方式
  buffer.writeUInt32LE(pixelDataSize, 34);    // 像素数据大小
  buffer.writeInt32LE(2835, 38);              // 水平分辨率
  buffer.writeInt32LE(2835, 42);              // 垂直分辨率
  buffer.writeUInt32LE(0, 46);                // 调色板颜色数
  buffer.writeUInt32LE(0, 50);                // 重要颜色数
  
  // 像素数据 (从底部开始)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const { r, g, b } = colorFunc(x, y, width, height);
      buffer.writeUInt8(b, offset++);
      buffer.writeUInt8(g, offset++);
      buffer.writeUInt8(r, offset++);
    }
    // 行对齐填充
    const padding = rowSize - width * 3;
    for (let p = 0; p < padding; p++) {
      buffer.writeUInt8(0, offset++);
    }
  }
  
  return buffer;
}

// 颜色渐变函数 - Header (深色科技风)
function headerGradient(x, y, width, height) {
  const t = x / width;
  // 从深蓝到青色渐变
  const r = Math.floor(12 + t * 22);
  const g = Math.floor(12 + t * 30);
  const b = Math.floor(20 + t * 40);
  return { r, g, b };
}

// 颜色渐变函数 - Sidebar (深色到亮色)
function sidebarGradient(x, y, width, height) {
  const t = y / height;
  // 从上到下：深色到稍亮
  const base = Math.floor(15 + t * 20);
  // 添加青色调
  const r = base;
  const g = Math.floor(base + t * 15);
  const b = Math.floor(base + t * 25);
  return { r, g, b };
}

// 生成图片
const nsisDir = path.join(__dirname, '..', 'src-tauri', 'nsis');

// Header: 150x57
const headerBmp = createBMP(150, 57, headerGradient);
fs.writeFileSync(path.join(nsisDir, 'header.bmp'), headerBmp);
console.log('✓ 生成 header.bmp (150x57)');

// Sidebar: 164x314
const sidebarBmp = createBMP(164, 314, sidebarGradient);
fs.writeFileSync(path.join(nsisDir, 'sidebar.bmp'), sidebarBmp);
console.log('✓ 生成 sidebar.bmp (164x314)');

console.log('\n安装包图片已生成到 src-tauri/nsis/ 目录');
