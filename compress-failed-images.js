/**
 * 重新压缩之前失败的图片
 * 使用更大的内存限制和降低质量
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'E:\\偶像大师\\闪耀色彩图片资源\\角色卡面';
const OUTPUT_DIR = 'E:\\偶像大师\\闪耀色彩图片资源-压缩版\\角色卡面';

// 之前压缩失败的文件名（从日志中提取）
const failedFiles = [
  '想ひいろは 杜野凛世.png',
  '気になる！？染めちゃう！？ 和泉愛依.png',
  '水×天カイヤナイト 黛冬優子+.png',
  '水×天カイヤナイト 黛冬優子.png',
  '水色感情 杜野凛世+.png',
  '水色感情 杜野凛世.png',
  '氷上バンビーナ 大崎甜花+.png',
  '氷上バンビーナ 大崎甜花.png',
  '泣けよ洗濯機 七草にちか+.png',
  '泣けよ洗濯機 七草にちか.png',
  '洸  風野灯織+.png',
  '洸  風野灯織.png',
  '流星パレット 郁田はるき+.png',
  '流星パレット 郁田はるき.png',
  '海と太陽のプロメッサ 白瀬咲耶+.png',
  '海と太陽のプロメッサ 白瀬咲耶.png',
  '海へと還る街 幽谷霧子+.png',
  '海へと還る街 幽谷霧子.png',
  '涼 風野灯織+.png',
  '涼 風野灯織.png',
  '深染め、いろみぐさ 櫻木真乃+.png',
  '深染め、いろみぐさ 櫻木真乃.png',
  '清閑に息をひそめて 風野灯織+.png',
  '清閑に息をひそめて 風野灯織.png',
  '渦と淵 白瀬咲耶+.png',
  '渦と淵 白瀬咲耶.png',
  '漂白花火 郁田はるき+.png',
  '潮騒のシーショア 小宮果穂+.png',
  '潮騒のシーショア 小宮果穂.png',
  '猫道カントリー 月岡恋鐘+.png',
  '猫道カントリー 月岡恋鐘.png',
  '琴・禽・空・華 幽谷霧子+.png',
  '紅茶夢現 黛冬優子+.png',
  '純白の君へ 鈴木羽那.png',
  '純真チョコレート 園田智代子+.png',
  '純真チョコレート 園田智代子.png',
  '純雪エモーショナル 月岡恋鐘+.png',
  '純雪エモーショナル 月岡恋鐘.png',
  '紺碧のボーダーライン 白瀬咲耶+.png',
  '絵空靴 杜野凛世.png',
  '縷・縷・屡・来 幽谷霧子+.png',
  '秋陽のスケッチ 西城樹里.png',
  '秘めやかファンサービス 白瀬咲耶+.png',
  '秘めやかファンサービス 白瀬咲耶.png',
];

console.log('=====================================');
console.log('  重新压缩失败的图片');
console.log('=====================================');
console.log('');
console.log(`📦 需要重新处理: ${failedFiles.length} 张图片`);
console.log('');

// 增加内存限制
sharp.cache(false); // 禁用缓存
sharp.concurrency(1); // 单线程处理

async function compressWithLowerQuality(inputPath, outputPath) {
  try {
    // 先检查文件大小
    const stats = fs.statSync(inputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log(`🔄 处理: ${path.basename(inputPath)} (${sizeMB} MB)`);

    // 对于超大文件，先缩小尺寸
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let pipeline = image;

    // 如果图片超过 4000px，先缩小
    if (metadata.width > 4000 || metadata.height > 4000) {
      console.log(`   📏 原始尺寸: ${metadata.width}x${metadata.height} - 需要缩小`);
      pipeline = pipeline.resize(3000, 3000, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // 使用更低的质量
    await pipeline
      .webp({ quality: 75, effort: 4 }) // 降低质量到75，减少压缩时间
      .toFile(outputPath);

    const outputStats = fs.statSync(outputPath);
    const outputSizeMB = (outputStats.size / 1024 / 1024).toFixed(2);
    const reduction = ((1 - outputStats.size / stats.size) * 100).toFixed(1);

    console.log(`   ✅ 成功: ${outputSizeMB} MB (减少 ${reduction}%)`);
    return true;
  } catch (error) {
    console.error(`   ❌ 仍然失败: ${error.message}`);
    return false;
  }
}

async function main() {
  let successCount = 0;
  let stillFailedCount = 0;
  let skippedCount = 0;

  for (const fileName of failedFiles) {
    const inputPath = path.join(SOURCE_DIR, fileName);
    const outputPath = path.join(OUTPUT_DIR, fileName.replace(/\.(png|jpg|jpeg)$/i, '.webp'));

    // 检查源文件是否存在
    if (!fs.existsSync(inputPath)) {
      console.log(`⏭️  跳过: ${fileName} (源文件不存在)`);
      skippedCount++;
      continue;
    }

    // 检查是否已经存在输出文件
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  跳过: ${fileName} (已存在)`);
      skippedCount++;
      continue;
    }

    const success = await compressWithLowerQuality(inputPath, outputPath);
    if (success) {
      successCount++;
    } else {
      stillFailedCount++;
    }

    // 等待一下，释放内存
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  console.log('=====================================');
  console.log('  处理完成');
  console.log('=====================================');
  console.log('');
  console.log(`✅ 成功: ${successCount} 张`);
  console.log(`❌ 仍失败: ${stillFailedCount} 张`);
  console.log(`⏭️  跳过: ${skippedCount} 张`);
  console.log('');

  if (stillFailedCount > 0) {
    console.log('💡 对于仍然失败的文件，可能需要：');
    console.log('   1. 手动使用 Photoshop 等工具压缩');
    console.log('   2. 或者接受这些文件无法压缩，使用原始PNG');
  }
}

main().catch(err => {
  console.error('❌ 处理失败:', err);
  process.exit(1);
});










