/**
 * 使用日文原名重建角色卡面库
 * 基于 重新扫描结果.json 的完整配对数据
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const JSON_INPUT = 'E:\\偶像大师\\重新扫描结果.json';
const OUTPUT_DIR = 'E:\\偶像大师\\闪耀色彩图片-最终版\\角色卡面';
const QUALITY = 85;
const MAX_CONCURRENT = 5;

console.log('=====================================');
console.log('  使用日文原名重建角色卡面库');
console.log('=====================================');
console.log('');

// 读取扫描结果
if (!fs.existsSync(JSON_INPUT)) {
  console.error(`❌ 找不到扫描结果: ${JSON_INPUT}`);
  console.log('   请先运行: node rescan-with-fuzzy-match.js');
  process.exit(1);
}

const scanResult = JSON.parse(fs.readFileSync(JSON_INPUT, 'utf8'));
console.log(`📖 读取扫描结果:`);
console.log(`   完整配对: ${scanResult.totalPairs} 组`);
console.log(`   总图片数: ${scanResult.totalPairs * 2} 张`);
console.log('');

// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ 创建输出目录: ${OUTPUT_DIR}`);
} else {
  console.log(`📁 输出目录已存在: ${OUTPUT_DIR}`);
}
console.log('');

// 压缩单个图片
async function compressImage(inputPath, outputPath) {
  const fileName = path.basename(inputPath);

  try {
    // 检查输入文件
    if (!fs.existsSync(inputPath)) {
      console.error(`⚠️  源文件不存在: ${fileName}`);
      return false;
    }

    // 检查是否已存在
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  跳过 (已存在): ${fileName}`);
      return true;
    }

    const stats = fs.statSync(inputPath);
    const inputSizeMB = (stats.size / 1024 / 1024).toFixed(2);

    // 压缩
    await sharp(inputPath).webp({ quality: QUALITY }).toFile(outputPath);

    const outputStats = fs.statSync(outputPath);
    const outputSizeMB = (outputStats.size / 1024 / 1024).toFixed(2);
    const reduction = ((1 - outputStats.size / stats.size) * 100).toFixed(1);

    console.log(`✅ ${fileName} (${inputSizeMB}MB → ${outputSizeMB}MB, -${reduction}%)`);
    return true;
  } catch (error) {
    console.error(`❌ 失败: ${fileName} - ${error.message}`);
    return false;
  }
}

// 批量处理
async function processInBatches(tasks, batchSize) {
  const results = [];

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(task => task()));
    results.push(...batchResults);

    // 显示进度
    const progress = Math.min(i + batchSize, tasks.length);
    const percentage = ((progress / tasks.length) * 100).toFixed(1);
    console.log(`📊 进度: ${progress}/${tasks.length} (${percentage}%)`);
    console.log('');
  }

  return results;
}

async function main() {
  console.log('=====================================');
  console.log('  开始处理');
  console.log('=====================================');
  console.log('');

  // 准备所有任务
  const tasks = [];

  for (const pair of scanResult.completePairs) {
    // 基础版
    const baseName = path.basename(pair.basePath);
    const baseOutput = path.join(OUTPUT_DIR, baseName.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
    tasks.push(() => compressImage(pair.basePath, baseOutput));

    // 觉醒版
    const awakenedName = path.basename(pair.awakenedPath);
    const awakenedOutput = path.join(OUTPUT_DIR, awakenedName.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
    tasks.push(() => compressImage(pair.awakenedPath, awakenedOutput));
  }

  console.log(`📦 准备处理 ${tasks.length} 个文件...`);
  console.log('');

  // 执行处理
  const startTime = Date.now();
  const results = await processInBatches(tasks, MAX_CONCURRENT);
  const endTime = Date.now();

  // 统计结果
  const successCount = results.filter(r => r === true).length;
  const failedCount = results.filter(r => r === false).length;
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  console.log('=====================================');
  console.log('  处理完成');
  console.log('=====================================');
  console.log('');
  console.log(`✅ 成功: ${successCount} 张`);
  console.log(`❌ 失败: ${failedCount} 张`);
  console.log(`⏱️  耗时: ${duration} 秒`);
  console.log('');
  console.log(`📁 输出目录: ${OUTPUT_DIR}`);
  console.log('');

  // 检查最终文件数
  const outputFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webp'));
  console.log(`📊 最终文件数: ${outputFiles.length} 张`);
  console.log(`🎯 预期文件数: ${scanResult.totalPairs * 2} 张`);

  if (outputFiles.length === scanResult.totalPairs * 2) {
    console.log('');
    console.log('🎉 完美！所有文件都已处理完成！');
    console.log('');
    console.log('📝 下一步：');
    console.log('   1. 检查输出文件');
    console.log('   2. 初始化 Git 仓库：');
    console.log(`      cd "${path.dirname(OUTPUT_DIR)}"`);
    console.log('      git init');
    console.log('      git add .');
    console.log('      git commit -m "初始化：使用日文原名的角色卡面"');
    console.log('   3. 创建 GitHub 仓库并推送');
  } else {
    console.log('');
    console.log('⚠️  文件数量不匹配，请检查失败的文件');
  }
}

main().catch(err => {
  console.error('❌ 处理失败:', err);
  process.exit(1);
});









