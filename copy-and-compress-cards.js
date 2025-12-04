/**
 * 批量复制并压缩卡面
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const JSON_INPUT = 'E:\\偶像大师\\完整角色卡面列表.json';
const TARGET_DIR = 'E:\\偶像大师\\闪耀色彩图片资源\\角色卡面';
const COMPRESSED_DIR = 'E:\\偶像大师\\闪耀色彩图片资源-压缩版\\角色卡面';
const QUALITY = 85;

console.log('=====================================');
console.log('  批量复制并压缩卡面');
console.log('=====================================');
console.log('');

// 读取JSON
if (!fs.existsSync(JSON_INPUT)) {
  console.error(`❌ 找不到JSON文件: ${JSON_INPUT}`);
  console.log('   请先运行: node scan-original-cards.js');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(JSON_INPUT, 'utf8'));
console.log(`📖 读取角色列表: ${data.totalPairs} 组完整配对`);
console.log('');

// 创建目录
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  console.log(`✅ 创建目录: ${TARGET_DIR}`);
}

if (!fs.existsSync(COMPRESSED_DIR)) {
  fs.mkdirSync(COMPRESSED_DIR, { recursive: true });
  console.log(`✅ 创建目录: ${COMPRESSED_DIR}`);
}

console.log('');
console.log('=====================================');
console.log('  阶段 1: 复制原始图片');
console.log('=====================================');
console.log('');

let copiedCount = 0;
let skippedCount = 0;

for (const pair of data.completePairs) {
  const cardName = pair.cardName;

  // 复制基础版
  const baseTarget = path.join(TARGET_DIR, `${cardName}.png`);
  if (fs.existsSync(baseTarget)) {
    console.log(`⏭️  跳过 (已存在): ${cardName}.png`);
    skippedCount++;
  } else {
    fs.copyFileSync(pair.basePath, baseTarget);
    console.log(`✅ 复制: ${cardName}.png`);
    copiedCount++;
  }

  // 复制觉醒版
  const awakenedTarget = path.join(TARGET_DIR, `${cardName}+.png`);
  if (fs.existsSync(awakenedTarget)) {
    console.log(`⏭️  跳过 (已存在): ${cardName}+.png`);
    skippedCount++;
  } else {
    fs.copyFileSync(pair.awakenedPath, awakenedTarget);
    console.log(`✅ 复制: ${cardName}+.png`);
    copiedCount++;
  }
}

console.log('');
console.log('📊 复制完成:');
console.log(`   新复制: ${copiedCount} 张`);
console.log(`   已跳过: ${skippedCount} 张`);
console.log('');

// 阶段2: 压缩
console.log('=====================================');
console.log('  阶段 2: 压缩为WebP');
console.log('=====================================');
console.log('');

async function compressAllImages() {
  const files = fs.readdirSync(TARGET_DIR);
  const imageFiles = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));

  console.log(`📦 需要压缩的图片: ${imageFiles.length} 张`);
  console.log('');

  let compressedCount = 0;
  let skippedCompressCount = 0;
  let totalInputSize = 0;
  let totalOutputSize = 0;

  for (const file of imageFiles) {
    const inputPath = path.join(TARGET_DIR, file);
    const outputPath = path.join(COMPRESSED_DIR, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'));

    // 跳过已存在的
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  跳过压缩: ${file}`);
      skippedCompressCount++;
      continue;
    }

    try {
      await sharp(inputPath).webp({ quality: QUALITY }).toFile(outputPath);

      const inputSize = fs.statSync(inputPath).size;
      const outputSize = fs.statSync(outputPath).size;
      const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);

      totalInputSize += inputSize;
      totalOutputSize += outputSize;

      console.log(`✅ ${path.basename(outputPath)} (减少 ${reduction}%)`);
      compressedCount++;
    } catch (error) {
      console.error(`❌ 失败: ${file}`, error.message);
    }
  }

  console.log('');
  console.log('📊 压缩完成:');
  console.log(`   新压缩: ${compressedCount} 张`);
  console.log(`   已跳过: ${skippedCompressCount} 张`);

  if (compressedCount > 0) {
    const avgReduction = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);
    console.log(`   平均减少: ${avgReduction}%`);
    console.log(`   节省空间: ${((totalInputSize - totalOutputSize) / 1024 / 1024).toFixed(2)} MB`);
  }

  console.log('');
  console.log('=====================================');
  console.log('  完成！');
  console.log('=====================================');
  console.log('');
  console.log(`✅ 原始图片目录: ${TARGET_DIR}`);
  console.log(`✅ 压缩图片目录: ${COMPRESSED_DIR}`);
  console.log('');
  console.log('📝 下一步:');
  console.log('   1. 检查压缩后的图片');
  console.log('   2. 提交到Git:');
  console.log(`      cd "${COMPRESSED_DIR}"`);
  console.log('      git add .');
  console.log('      git commit -m "补充缺失的角色卡面"');
  console.log('      git push origin main');
  console.log('');
}

compressAllImages().catch(err => {
  console.error('❌ 压缩失败:', err);
  process.exit(1);
});










