/**
 * 重新扫描 - 使用模糊匹配找出真正不配对的卡面
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'E:\\BaiduNetdiskDownload\\闪耀色彩';
const OUTPUT_JSON = 'E:\\偶像大师\\重新扫描结果.json';

console.log('=====================================');
console.log('  重新扫描 - 模糊匹配');
console.log('=====================================');
console.log('');

// 递归获取所有图片
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

// 标准化文件名（用于模糊匹配）
function normalizeName(name) {
  return name
    .replace(/\s+/g, '') // 移除所有空格
    .replace(/[・·]/g, '') // 移除中点
    .replace(/[！!]/g, '') // 移除感叹号
    .replace(/[？?]/g, '') // 移除问号
    .replace(/[～~]/g, '') // 移除波浪号
    .toLowerCase();
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

  if (baseName.endsWith('+')) {
    const cardName = baseName.slice(0, -1);
    const normalizedName = normalizeName(cardName);
    awakenedCards.set(normalizedName, {
      originalName: cardName,
      filePath,
      fileName,
    });
  } else {
    const normalizedName = normalizeName(baseName);
    baseCards.set(normalizedName, {
      originalName: baseName,
      filePath,
      fileName,
    });
  }
}

console.log('📈 统计信息:');
console.log(`   基础版卡面: ${baseCards.size} 张`);
console.log(`   觉醒版卡面: ${awakenedCards.size} 张`);
console.log('');

// 模糊匹配
const completePairs = [];
const matchedBaseKeys = new Set();
const matchedAwakenedKeys = new Set();

for (const [baseKey, baseInfo] of baseCards) {
  if (awakenedCards.has(baseKey)) {
    const awakenedInfo = awakenedCards.get(baseKey);

    completePairs.push({
      cardName: baseInfo.originalName,
      basePath: baseInfo.filePath,
      awakenedPath: awakenedInfo.filePath,
      baseFileName: baseInfo.fileName,
      awakenedFileName: awakenedInfo.fileName,
    });

    matchedBaseKeys.add(baseKey);
    matchedAwakenedKeys.add(baseKey);
  }
}

console.log(`✅ 模糊匹配成功: ${completePairs.length} 组`);
console.log('');

// 真正不配对的文件
const trueUnmatchedBase = [];
const trueUnmatchedAwakened = [];

for (const [key, info] of baseCards) {
  if (!matchedBaseKeys.has(key)) {
    trueUnmatchedBase.push({
      normalizedName: key,
      originalName: info.originalName,
      fileName: info.fileName,
      filePath: info.filePath,
    });
  }
}

for (const [key, info] of awakenedCards) {
  if (!matchedAwakenedKeys.has(key)) {
    trueUnmatchedAwakened.push({
      normalizedName: key,
      originalName: info.originalName,
      fileName: info.fileName,
      filePath: info.filePath,
    });
  }
}

console.log('⚠️  真正不配对的卡面:');
console.log(`   只有基础版: ${trueUnmatchedBase.length} 张`);
if (trueUnmatchedBase.length > 0) {
  console.log('');
  console.log('   示例（前10个）:');
  trueUnmatchedBase.slice(0, 10).forEach(item => {
    console.log(`      - ${item.fileName}`);
  });
  if (trueUnmatchedBase.length > 10) {
    console.log(`      ... 还有 ${trueUnmatchedBase.length - 10} 张`);
  }
}

console.log('');
console.log(`   只有觉醒版: ${trueUnmatchedAwakened.length} 张`);
if (trueUnmatchedAwakened.length > 0) {
  console.log('');
  console.log('   完整列表:');
  trueUnmatchedAwakened.forEach(item => {
    console.log(`      - ${item.fileName}`);
    console.log(`        路径: ${item.filePath}`);
    console.log(`        标准化: ${item.normalizedName}`);
    console.log('');
  });
}

// 保存结果
const result = {
  generatedAt: new Date().toISOString(),
  totalPairs: completePairs.length,
  trueUnmatchedBase: trueUnmatchedBase.length,
  trueUnmatchedAwakened: trueUnmatchedAwakened.length,
  unmatchedBaseDetails: trueUnmatchedBase,
  unmatchedAwakenedDetails: trueUnmatchedAwakened,
  completePairs: completePairs,
};

fs.writeFileSync(OUTPUT_JSON, JSON.stringify(result, null, 2), 'utf8');

console.log('');
console.log('=====================================');
console.log('  重新扫描完成');
console.log('=====================================');
console.log('');
console.log(`✅ 完整配对: ${completePairs.length} 组`);
console.log(`⚠️  只有基础版: ${trueUnmatchedBase.length} 张`);
console.log(`⚠️  只有觉醒版: ${trueUnmatchedAwakened.length} 张`);
console.log('');
console.log(`📝 详细结果已保存: ${OUTPUT_JSON}`);










