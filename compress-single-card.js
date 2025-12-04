/**
 * 压缩单张卡面为WebP
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'E:\\偶像大师\\闪耀色彩图片资源\\角色卡面';
const OUTPUT_DIR = 'E:\\偶像大师\\闪耀色彩图片资源-压缩版\\角色卡面';

// 要压缩的文件
const FILES_TO_COMPRESS = ['YuYou_Suzuki.Hana.png', 'YuYou_Suzuki.Hana+.png'];

async function compressCard(filename) {
  const inputPath = path.join(SOURCE_DIR, filename);
  const outputFilename = filename.replace(/\.png$/i, '.webp');
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 文件不存在: ${inputPath}`);
    return;
  }

  console.log(`🔄 压缩中: ${filename}...`);

  try {
    const info = await sharp(inputPath).webp({ quality: 85, effort: 6 }).toFile(outputPath);

    const sizeMB = (info.size / 1024 / 1024).toFixed(2);
    console.log(`✅ 完成: ${outputFilename} (${sizeMB} MB)`);
  } catch (error) {
    console.error(`❌ 压缩失败 ${filename}:`, error.message);
  }
}

async function main() {
  console.log('🖼️  开始压缩【優You】鈴木羽那卡面...\n');

  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 压缩所有文件
  for (const file of FILES_TO_COMPRESS) {
    await compressCard(file);
  }

  console.log('\n🎉 压缩完成！');
}

main().catch(console.error);



