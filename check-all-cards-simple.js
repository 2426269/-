/**
 * 简化版：直接检查文件系统和 real-cards.ts 的对应关系
 */

const fs = require('fs');
const path = require('path');

// 卡面目录
const CARD_DIR = 'E:\\偶像大师\\闪耀色彩图片资源-压缩版\\角色卡面';

// 读取 name-mappings.ts 并动态执行其中的映射
const nameMappingsPath = 'E:\\偶像大师\\tavern_helper_template\\src\\偶像大师闪耀色彩-gacha\\data\\name-mappings.ts';
const mappingsContent = fs.readFileSync(nameMappingsPath, 'utf-8');

// 提取 CHARACTER_TO_ROMAN
const characterMatch = mappingsContent.match(/export const CHARACTER_TO_ROMAN[^}]+\}/s);
const characterMapStr = characterMatch[0]
  .replace('export const CHARACTER_TO_ROMAN', 'const CHARACTER_TO_ROMAN')
  .replace(/'/g, '"');

// 提取 THEME_TO_ROMAN
const themeMatch = mappingsContent.match(/export const THEME_TO_ROMAN[^}]+\}/s);
const themeMapStr = themeMatch[0].replace('export const THEME_TO_ROMAN', 'const THEME_TO_ROMAN').replace(/'/g, '"');

// 执行映射定义
eval(characterMapStr);
eval(themeMapStr);

/**
 * 将卡名转换为文件名（复制自 name-mappings.ts 的逻辑）
 */
function cardNameToFileName(fullCardName) {
  const match = fullCardName.match(/【(.+)】(.+)/);
  if (!match) {
    return null;
  }

  const [, theme, character] = match;
  const themeRoman = THEME_TO_ROMAN[theme];
  const characterRoman = CHARACTER_TO_ROMAN[character];

  if (!themeRoman || !characterRoman) {
    return null;
  }

  return `${themeRoman}_${characterRoman}`;
}

/**
 * 检查文件是否存在
 */
function checkFileExists(fileName) {
  const webpPath = path.join(CARD_DIR, `${fileName}.webp`);
  return fs.existsSync(webpPath);
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 开始检查所有卡面文件...\n');

  // 读取 real-cards.ts 文件内容
  const realCardsPath = 'E:\\偶像大师\\tavern_helper_template\\src\\偶像大师闪耀色彩-gacha\\data\\real-cards.ts';
  const content = fs.readFileSync(realCardsPath, 'utf-8');

  // 提取所有卡名
  const cardNameRegex = /name:\s*'([^']+)'/g;
  const allCardNames = [];
  let match;
  while ((match = cardNameRegex.exec(content)) !== null) {
    allCardNames.push(match[1]);
  }

  console.log(`📊 real-cards.ts 中共有 ${allCardNames.length} 张卡\n`);

  // 检查每张卡
  const missingCards = [];
  const errorCards = [];
  let successCount = 0;

  for (const cardName of allCardNames) {
    const fileName = cardNameToFileName(cardName);

    if (!fileName) {
      errorCards.push(cardName);
      console.log(`⚠️  无法转换: ${cardName}`);
      continue;
    }

    const exists = checkFileExists(fileName);

    if (!exists) {
      missingCards.push(cardName);
      console.log(`❌ 缺失: ${cardName} → ${fileName}.webp`);
    } else {
      successCount++;
    }
  }

  // 输出汇总
  console.log('\n' + '='.repeat(80));
  console.log('📊 检查结果汇总\n');

  console.log(`✅ 正常的卡: ${successCount} 张`);
  console.log(`❌ 缺失的卡: ${missingCards.length} 张`);
  console.log(`⚠️  无法转换的卡: ${errorCards.length} 张\n`);

  if (missingCards.length > 0) {
    console.log('📝 需要添加到 UNAVAILABLE_CARDS 的卡片:\n');
    missingCards.forEach(card => console.log(`  '${card}',`));
  }

  if (errorCards.length > 0) {
    console.log('\n⚠️  无法转换文件名的卡片（需要更新映射）:\n');
    errorCards.forEach(card => console.log(`  '${card}',`));
  }
}

main().catch(console.error);



