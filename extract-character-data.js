/**
 * 从扫描结果提取角色和卡面数据
 * 生成用于代码的角色库和卡池库
 */

const fs = require('fs');
const path = require('path');

const JSON_INPUT = 'E:\\偶像大师\\重新扫描结果.json';
const OUTPUT_CHARACTERS = 'E:\\偶像大师\\角色库-最终版.json';
const OUTPUT_CARDS = 'E:\\偶像大师\\卡面库-最终版.json';

console.log('=====================================');
console.log('  提取角色和卡面数据');
console.log('=====================================');
console.log('');

// 读取扫描结果
const scanResult = JSON.parse(fs.readFileSync(JSON_INPUT, 'utf8'));
console.log(`📖 读取完整配对: ${scanResult.totalPairs} 组`);
console.log('');

// 解析文件名格式：主题名 角色名.png 或 主题名 角色名+.png
function parseFileName(fileName) {
  const baseName = fileName.replace(/\.(png|jpg|jpeg)$/i, '');
  const isAwakened = baseName.endsWith('+');
  const cleanName = isAwakened ? baseName.slice(0, -1) : baseName;

  // 分离主题和角色名
  const lastSpaceIndex = cleanName.lastIndexOf(' ');
  if (lastSpaceIndex === -1) {
    return null; // 无法解析
  }

  const themeName = cleanName.substring(0, lastSpaceIndex).trim();
  const characterName = cleanName.substring(lastSpaceIndex + 1).trim();

  return {
    themeName,
    characterName,
    isAwakened,
    originalFileName: fileName,
  };
}

// 收集所有角色和卡面
const charactersMap = new Map(); // 角色名 -> 角色数据
const cardsArray = []; // 所有卡面

console.log('🔍 解析文件名...');

for (const pair of scanResult.completePairs) {
  // 解析基础版
  const baseInfo = parseFileName(pair.baseFileName);
  if (!baseInfo) {
    console.warn(`⚠️  无法解析基础版: ${pair.baseFileName}`);
    continue;
  }

  // 解析觉醒版
  const awakenedInfo = parseFileName(pair.awakenedFileName);
  if (!awakenedInfo) {
    console.warn(`⚠️  无法解析觉醒版: ${pair.awakenedFileName}`);
    continue;
  }

  // 添加角色（如果不存在）
  if (!charactersMap.has(baseInfo.characterName)) {
    charactersMap.set(baseInfo.characterName, {
      name: baseInfo.characterName,
      cardCount: 0,
      themes: [],
    });
  }

  const character = charactersMap.get(baseInfo.characterName);
  character.cardCount++;
  if (!character.themes.includes(baseInfo.themeName)) {
    character.themes.push(baseInfo.themeName);
  }

  // 添加卡面对
  cardsArray.push({
    characterName: baseInfo.characterName,
    themeName: baseInfo.themeName,
    baseImage: baseInfo.originalFileName.replace(/\.(png|jpg|jpeg)$/i, '.webp'),
    awakenedImage: awakenedInfo.originalFileName.replace(/\.(png|jpg|jpeg)$/i, '.webp'),
    fullName: `【${baseInfo.themeName}】${baseInfo.characterName}`,
  });
}

// 转换为数组并排序
const characters = Array.from(charactersMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ja'));

console.log('');
console.log('✅ 数据统计:');
console.log(`   角色数: ${characters.length} 位`);
console.log(`   卡面数: ${cardsArray.length} 张完整配对`);
console.log('');

// 显示角色列表（前20位）
console.log('📋 角色列表（前20位）:');
characters.slice(0, 20).forEach((char, index) => {
  console.log(`   ${(index + 1).toString().padStart(2)}) ${char.name} - ${char.cardCount} 张卡面`);
});
if (characters.length > 20) {
  console.log(`   ... 还有 ${characters.length - 20} 位角色`);
}
console.log('');

// 保存为 JSON
fs.writeFileSync(
  OUTPUT_CHARACTERS,
  JSON.stringify(
    {
      totalCharacters: characters.length,
      characters: characters,
    },
    null,
    2,
  ),
  'utf8',
);

fs.writeFileSync(
  OUTPUT_CARDS,
  JSON.stringify(
    {
      totalCards: cardsArray.length,
      cards: cardsArray,
    },
    null,
    2,
  ),
  'utf8',
);

console.log('💾 已保存:');
console.log(`   ${OUTPUT_CHARACTERS}`);
console.log(`   ${OUTPUT_CARDS}`);
console.log('');

// 生成统计信息
const topCharacters = characters.sort((a, b) => b.cardCount - a.cardCount).slice(0, 10);

console.log('🏆 卡面数量排行（前10位）:');
topCharacters.forEach((char, index) => {
  console.log(`   ${index + 1}. ${char.name} - ${char.cardCount} 张`);
});
console.log('');

console.log('🎉 数据提取完成！');
