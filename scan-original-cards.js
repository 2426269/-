/**
 * 扫描原始卡面目录，找出所有成对的卡面
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'E:\\BaiduNetdiskDownload\\闪耀色彩';
const OUTPUT_JSON = 'E:\\偶像大师\\完整角色卡面列表.json';
const OUTPUT_TXT = 'E:\\偶像大师\\完整角色卡面列表.txt';

console.log('=====================================');
console.log('  扫描原始卡面目录');
console.log('=====================================');
console.log('');

// 检查源目录
if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`❌ 源目录不存在: ${SOURCE_DIR}`);
  process.exit(1);
}

console.log(`📁 扫描目录: ${SOURCE_DIR}`);
console.log('');

// 递归获取所有图片文件
function getAllImageFiles(dir) {
  const files = [];

  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (/\.(png|jpg|jpeg)$/i.test(item)) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

console.log('🔍 正在扫描文件...');
const allFiles = getAllImageFiles(SOURCE_DIR);
console.log(`📊 找到图片文件总数: ${allFiles.length}`);
console.log('');

// 分类文件
const baseCards = new Map();
const awakenedCards = new Map();

for (const filePath of allFiles) {
  const fileName = path.basename(filePath);
  const baseName = path.parse(fileName).name;

  // 检查是否是觉醒版（+后缀）
  if (baseName.endsWith('+')) {
    const cardName = baseName.slice(0, -1);
    awakenedCards.set(cardName, filePath);
  } else {
    baseCards.set(baseName, filePath);
  }
}

console.log('📈 统计信息:');
console.log(`   基础版卡面: ${baseCards.size} 张`);
console.log(`   觉醒版卡面: ${awakenedCards.size} 张`);
console.log('');

// 找到完整的成对卡面
const completePairs = [];
for (const [cardName, basePath] of baseCards) {
  if (awakenedCards.has(cardName)) {
    const awakenedPath = awakenedCards.get(cardName);
    const baseSize = fs.statSync(basePath).size;
    const awakenedSize = fs.statSync(awakenedPath).size;

    completePairs.push({
      cardName,
      basePath,
      awakenedPath,
      baseSize,
      awakenedSize,
    });
  }
}

// 排序
completePairs.sort((a, b) => a.cardName.localeCompare(b.cardName));

console.log(`✅ 找到完整配对的卡面: ${completePairs.length} 组 (共 ${completePairs.length * 2} 张)`);
console.log('');

// 找到不完整的卡面
const incompleteBase = [];
const incompleteAwakened = [];

for (const cardName of baseCards.keys()) {
  if (!awakenedCards.has(cardName)) {
    incompleteBase.push(cardName);
  }
}

for (const cardName of awakenedCards.keys()) {
  if (!baseCards.has(cardName)) {
    incompleteAwakened.push(cardName);
  }
}

if (incompleteBase.length > 0 || incompleteAwakened.length > 0) {
  console.log('⚠️  不完整的卡面 (只有一张):');
  if (incompleteBase.length > 0) {
    console.log(`   只有基础版: ${incompleteBase.length} 张`);
    incompleteBase.slice(0, 5).forEach(name => {
      console.log(`      - ${name}`);
    });
    if (incompleteBase.length > 5) {
      console.log(`      ... 还有 ${incompleteBase.length - 5} 张`);
    }
  }
  if (incompleteAwakened.length > 0) {
    console.log(`   只有觉醒版: ${incompleteAwakened.length} 张`);
    incompleteAwakened.slice(0, 5).forEach(name => {
      console.log(`      - ${name}`);
    });
    if (incompleteAwakened.length > 5) {
      console.log(`      ... 还有 ${incompleteAwakened.length - 5} 张`);
    }
  }
  console.log('');
}

// 生成JSON
const jsonData = {
  generatedAt: new Date().toISOString(),
  totalPairs: completePairs.length,
  totalImages: completePairs.length * 2,
  completePairs,
  incompleteBase,
  incompleteAwakened,
};

fs.writeFileSync(OUTPUT_JSON, JSON.stringify(jsonData, null, 2), 'utf8');
console.log(`📝 已保存JSON: ${OUTPUT_JSON}`);

// 生成文本列表
const lines = [];
lines.push('# 闪耀色彩完整角色卡面列表');
lines.push(`# 生成时间: ${new Date().toLocaleString('zh-CN')}`);
lines.push(`# 完整配对: ${completePairs.length} 组 (${completePairs.length * 2} 张)`);
lines.push('');
lines.push('## 完整配对的卡面');
lines.push('');

for (const pair of completePairs) {
  lines.push(`【${pair.cardName}】`);
  lines.push(`  基础版: ${pair.basePath}`);
  lines.push(`  觉醒版: ${pair.awakenedPath}`);
  lines.push(`  大小: ${(pair.baseSize / 1024).toFixed(2)} KB + ${(pair.awakenedSize / 1024).toFixed(2)} KB`);
  lines.push('');
}

fs.writeFileSync(OUTPUT_TXT, lines.join('\n'), 'utf8');
console.log(`📝 已保存文本: ${OUTPUT_TXT}`);
console.log('');

// 显示摘要
console.log('=====================================');
console.log('  扫描完成 - 摘要');
console.log('=====================================');
console.log('');
console.log(`✅ 完整配对: ${completePairs.length} 组`);
console.log(`⚠️  不完整 (仅基础版): ${incompleteBase.length} 张`);
console.log(`⚠️  不完整 (仅觉醒版): ${incompleteAwakened.length} 张`);
console.log(`📊 总图片数: ${allFiles.length} 张`);
console.log('');

// 显示前10个配对
console.log('📋 示例配对 (前10个):');
completePairs.slice(0, 10).forEach(pair => {
  console.log(`   ${pair.cardName}`);
});
if (completePairs.length > 10) {
  console.log(`   ... 还有 ${completePairs.length - 10} 个`);
}
console.log('');

console.log('🎉 扫描完成！下一步：运行复制和压缩脚本');
