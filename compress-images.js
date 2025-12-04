/**
 * 图片压缩脚本 - 批量压缩PNG/JPG并转换为WebP
 *
 * 功能：
 * 1. 扫描指定目录下的所有图片
 * 2. 压缩PNG/JPG（保留原格式）
 * 3. 同时生成WebP版本（可选）
 * 4. 显示压缩统计信息
 *
 * 使用方法：
 *   node compress-images.js
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// ==================== 配置区域 ====================

const CONFIG = {
  // 源目录（要压缩的图片所在位置）
  SOURCE_DIR: 'E:\\偶像大师\\闪耀色彩图片资源\\角色卡面',

  // 输出目录（压缩后的图片保存位置）
  OUTPUT_DIR: 'E:\\偶像大师\\闪耀色彩图片资源-压缩版\\角色卡面',

  // 是否生成WebP格式（推荐：true）
  GENERATE_WEBP: true,

  // 压缩质量配置
  QUALITY: {
    PNG: 85, // PNG压缩质量 (0-100)，85能保持高质量且大幅减小体积
    JPEG: 85, // JPEG压缩质量 (0-100)
    WEBP: 85, // WebP压缩质量 (0-100)，WebP在85质量下通常比PNG小50%+
  },

  // 要处理的文件扩展名
  EXTENSIONS: ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'],

  // 跳过小于此大小的文件（字节），避免过度压缩小图标
  MIN_FILE_SIZE: 10 * 1024, // 10KB

  // 最大并发处理数量（避免内存溢出）
  MAX_CONCURRENT: 5,
};

// ==================== 工具函数 ====================

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 递归获取目录下所有图片文件
 */
async function getAllImageFiles(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      await getAllImageFiles(fullPath, fileList);
    } else {
      const ext = path.extname(file.name).toLowerCase();
      if (CONFIG.EXTENSIONS.includes(ext)) {
        const stats = await fs.stat(fullPath);
        if (stats.size >= CONFIG.MIN_FILE_SIZE) {
          fileList.push(fullPath);
        }
      }
    }
  }

  return fileList;
}

/**
 * 压缩单个图片文件
 */
async function compressImage(inputPath, outputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const stats = await fs.stat(inputPath);
  const originalSize = stats.size;

  // 确保输出目录存在
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  let compressedSize = 0;
  let webpSize = 0;

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // 压缩原格式
    if (ext === '.png') {
      await image
        .png({
          quality: CONFIG.QUALITY.PNG,
          compressionLevel: 9, // 最高压缩级别
          adaptiveFiltering: true,
        })
        .toFile(outputPath);
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      await image
        .jpeg({
          quality: CONFIG.QUALITY.JPEG,
          progressive: true,
          optimizeScans: true,
        })
        .toFile(outputPath);
    }

    const compressedStats = await fs.stat(outputPath);
    compressedSize = compressedStats.size;

    // 生成WebP版本
    if (CONFIG.GENERATE_WEBP) {
      const webpPath = outputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      await sharp(inputPath)
        .webp({
          quality: CONFIG.QUALITY.WEBP,
          effort: 6, // 压缩努力程度 (0-6)，6最慢但最小
        })
        .toFile(webpPath);

      const webpStats = await fs.stat(webpPath);
      webpSize = webpStats.size;
    }

    return {
      success: true,
      originalSize,
      compressedSize,
      webpSize,
      savedBytes: originalSize - compressedSize,
      savedPercent: ((1 - compressedSize / originalSize) * 100).toFixed(1),
    };
  } catch (error) {
    console.error(`❌ 压缩失败: ${path.basename(inputPath)}`);
    console.error(`   错误: ${error.message}`);
    return {
      success: false,
      originalSize,
      error: error.message,
    };
  }
}

/**
 * 批量压缩（带并发控制）
 */
async function compressBatch(files) {
  const stats = {
    total: files.length,
    processed: 0,
    success: 0,
    failed: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    totalWebpSize: 0,
  };

  console.log(`\n📦 开始压缩 ${files.length} 个文件...\n`);

  for (let i = 0; i < files.length; i += CONFIG.MAX_CONCURRENT) {
    const batch = files.slice(i, i + CONFIG.MAX_CONCURRENT);

    const results = await Promise.all(
      batch.map(async inputPath => {
        const relativePath = path.relative(CONFIG.SOURCE_DIR, inputPath);
        const outputPath = path.join(CONFIG.OUTPUT_DIR, relativePath);

        const result = await compressImage(inputPath, outputPath);
        stats.processed++;

        if (result.success) {
          stats.success++;
          stats.totalOriginalSize += result.originalSize;
          stats.totalCompressedSize += result.compressedSize;
          stats.totalWebpSize += result.webpSize || 0;

          console.log(
            `✅ [${stats.processed}/${stats.total}] ${path.basename(inputPath)}\n` +
              `   原始: ${formatSize(result.originalSize)} → ` +
              `压缩: ${formatSize(result.compressedSize)} (省 ${result.savedPercent}%)` +
              (result.webpSize ? ` | WebP: ${formatSize(result.webpSize)}` : ''),
          );
        } else {
          stats.failed++;
        }

        return result;
      }),
    );
  }

  return stats;
}

/**
 * 主函数
 */
async function main() {
  console.log('🎨 图片压缩工具启动\n');
  console.log('配置信息:');
  console.log(`  源目录: ${CONFIG.SOURCE_DIR}`);
  console.log(`  输出目录: ${CONFIG.OUTPUT_DIR}`);
  console.log(`  PNG质量: ${CONFIG.QUALITY.PNG}`);
  console.log(`  JPEG质量: ${CONFIG.QUALITY.JPEG}`);
  console.log(`  WebP质量: ${CONFIG.QUALITY.WEBP}`);
  console.log(`  生成WebP: ${CONFIG.GENERATE_WEBP ? '是' : '否'}\n`);

  // 检查源目录
  try {
    await fs.access(CONFIG.SOURCE_DIR);
  } catch (error) {
    console.error(`❌ 源目录不存在: ${CONFIG.SOURCE_DIR}`);
    process.exit(1);
  }

  // 创建输出目录
  await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });

  // 扫描文件
  console.log('🔍 扫描图片文件...');
  const files = await getAllImageFiles(CONFIG.SOURCE_DIR);
  console.log(`✅ 找到 ${files.length} 个图片文件`);

  if (files.length === 0) {
    console.log('⚠️  没有找到需要压缩的图片');
    return;
  }

  // 开始压缩
  const startTime = Date.now();
  const stats = await compressBatch(files);
  const endTime = Date.now();

  // 打印统计信息
  console.log('\n' + '='.repeat(60));
  console.log('📊 压缩完成统计\n');
  console.log(`总文件数: ${stats.total}`);
  console.log(`成功: ${stats.success} | 失败: ${stats.failed}`);
  console.log(`\n原始总大小: ${formatSize(stats.totalOriginalSize)}`);
  console.log(`压缩后大小: ${formatSize(stats.totalCompressedSize)}`);

  if (CONFIG.GENERATE_WEBP) {
    console.log(`WebP总大小: ${formatSize(stats.totalWebpSize)}`);
  }

  const savedBytes = stats.totalOriginalSize - stats.totalCompressedSize;
  const savedPercent = ((savedBytes / stats.totalOriginalSize) * 100).toFixed(1);

  console.log(`\n💾 节省空间: ${formatSize(savedBytes)} (${savedPercent}%)`);

  if (CONFIG.GENERATE_WEBP && stats.totalWebpSize > 0) {
    const webpSaved = stats.totalOriginalSize - stats.totalWebpSize;
    const webpPercent = ((webpSaved / stats.totalOriginalSize) * 100).toFixed(1);
    console.log(`📦 WebP节省: ${formatSize(webpSaved)} (${webpPercent}%)`);
  }

  console.log(`\n⏱️  耗时: ${((endTime - startTime) / 1000).toFixed(1)} 秒`);
  console.log('='.repeat(60));
}

// 运行
main().catch(error => {
  console.error('❌ 发生错误:', error);
  process.exit(1);
});
