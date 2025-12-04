/**
 * 生成 "星月夜を歩いて" 卡池数据
 *
 * 从角色表.txt读取卡池配置，从 all-cards.ts 中匹配卡片数据
 */

const fs = require('fs');
const path = require('path');

const POOL_TXT = 'C:\\Users\\33987\\Desktop\\角色表.txt';
const ALL_CARDS_FILE = 'tavern_helper_template\\src\\偶像大师闪耀色彩-gacha\\data\\all-cards.ts';
const OUTPUT_FILE = 'tavern_helper_template\\src\\偶像大师闪耀色彩-gacha\\data\\pools\\starry-night.ts';

// 解析角色表
function parsePoolTxt() {
  console.log('📋 读取角色表...');
  const content = fs.readFileSync(POOL_TXT, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  const poolData = {
    pickup: null,
    ur: [],
    ssr: [],
    sr: [],
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 3) continue;

    const [rarity, theme, character] = parts;
    // 去除角色名中的空格以匹配 all-cards.ts
    const fullName = `${theme}${character.replace(/\s+/g, '')}`;

    if (rarity === 'up角色') {
      poolData.pickup = fullName;
    } else if (rarity === 'UR') {
      poolData.ur.push(fullName);
    } else if (rarity === 'SSR') {
      poolData.ssr.push(fullName);
    } else if (rarity === 'SR') {
      poolData.sr.push(fullName);
    }
  }

  console.log('✅ 角色表解析完成:');
  console.log(`  - UP: 1 张`);
  console.log(`  - UR: ${poolData.ur.length} 张`);
  console.log(`  - SSR: ${poolData.ssr.length} 张`);
  console.log(`  - SR: ${poolData.sr.length} 张`);
  console.log(`  - 总计: ${1 + poolData.ur.length + poolData.ssr.length + poolData.sr.length} 张\n`);

  return poolData;
}

// 解析 all-cards.ts（简单的正则匹配）
function parseAllCards() {
  console.log('📦 读取 all-cards.ts...');
  const content = fs.readFileSync(ALL_CARDS_FILE, 'utf-8');

  // 提取所有卡片的 fullName
  const cardNameRegex = /fullName:\s*["']([^"']+)["']/g;
  const allCardNames = [];
  let match;

  while ((match = cardNameRegex.exec(content)) !== null) {
    allCardNames.push(match[1]);
  }

  console.log(`✅ 找到 ${allCardNames.length} 张卡面\n`);
  return allCardNames;
}

// 规范化卡名（去除空格并统一符号）
function normalizeCardName(name) {
  return name
    .replace(/\s+/g, '') // 去除所有空格
    .replace(/[♡♥]/g, '❤') // 统一心形符号
    .replace(/[／/]/g, '/') // 统一斜杠
    .replace(/[・·‧]/g, '·') // 统一中点
    .replace(/[-ー－]/g, '-') // 统一连字符
    .toLowerCase(); // 转小写进行比较
}

// 匹配卡片
function matchCards(poolData, allCardNames) {
  console.log('🔍 匹配卡片...');

  const matched = {
    pickup: null,
    ur: [],
    ssr: [],
    sr: [],
  };

  const notFound = [];

  // 创建规范化名称到原始名称的映射
  const cardNameMap = new Map();
  allCardNames.forEach(name => {
    cardNameMap.set(normalizeCardName(name), name);
  });

  // 匹配 UP 角色
  if (poolData.pickup) {
    const normalized = normalizeCardName(poolData.pickup);
    if (cardNameMap.has(normalized)) {
      matched.pickup = cardNameMap.get(normalized);
    } else {
      notFound.push(`UP: ${poolData.pickup}`);
    }
  }

  // 匹配 UR
  poolData.ur.forEach(cardName => {
    const normalized = normalizeCardName(cardName);
    if (cardNameMap.has(normalized)) {
      matched.ur.push(cardNameMap.get(normalized));
    } else {
      notFound.push(`UR: ${cardName}`);
    }
  });

  // 匹配 SSR
  poolData.ssr.forEach(cardName => {
    const normalized = normalizeCardName(cardName);
    if (cardNameMap.has(normalized)) {
      matched.ssr.push(cardNameMap.get(normalized));
    } else {
      notFound.push(`SSR: ${cardName}`);
    }
  });

  // 匹配 SR
  poolData.sr.forEach(cardName => {
    const normalized = normalizeCardName(cardName);
    if (cardNameMap.has(normalized)) {
      matched.sr.push(cardNameMap.get(normalized));
    } else {
      notFound.push(`SR: ${cardName}`);
    }
  });

  console.log('✅ 匹配完成:');
  console.log(`  - UP: ${matched.pickup ? 1 : 0} 张`);
  console.log(`  - UR: ${matched.ur.length} 张`);
  console.log(`  - SSR: ${matched.ssr.length} 张`);
  console.log(`  - SR: ${matched.sr.length} 张`);
  console.log(
    `  - 成功匹配: ${(matched.pickup ? 1 : 0) + matched.ur.length + matched.ssr.length + matched.sr.length} 张`,
  );

  if (notFound.length > 0) {
    console.log(`\n⚠️  未找到匹配的卡片 (${notFound.length} 张):`);
    notFound.slice(0, 10).forEach(name => console.log(`  - ${name}`));
    if (notFound.length > 10) {
      console.log(`  ... 还有 ${notFound.length - 10} 张未显示`);
    }
  }

  return { matched, notFound };
}

// 生成 TypeScript 代码
function generatePoolFile(matched) {
  console.log('\n📝 生成卡池文件...');

  const allCards = [...(matched.pickup ? [matched.pickup] : []), ...matched.ur, ...matched.ssr, ...matched.sr];

  // 读取 all-cards.ts 获取完整卡片数据
  const allCardsContent = fs.readFileSync(ALL_CARDS_FILE, 'utf-8');

  // 提取卡片名到完整数据的映射
  function findCardData(cardName) {
    // 查找以 fullName: "cardName" 开始的卡片数据块
    const escapedName = cardName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cardBlockRegex = new RegExp(`\\{\\s*fullName:\\s*["']${escapedName}["'][^}]+\\}`, 's');
    const match = allCardsContent.match(cardBlockRegex);
    return match ? match[0] : null;
  }

  const pickupCardData = matched.pickup ? findCardData(matched.pickup) : null;
  const urCardsData = matched.ur.map(findCardData).filter(Boolean);
  const ssrCardsData = matched.ssr.map(findCardData).filter(Boolean);
  const srCardsData = matched.sr.map(findCardData).filter(Boolean);

  // 生成文件内容
  const fileContent = `/**
 * "星月夜を歩いて" 限定卡池
 * 
 * UP角色：【絵空靴】杜野凛世
 * 总卡片数：${allCards.length} 张
 * 
 * 稀有度分布：
 * - UR: ${(matched.pickup ? 1 : 0) + matched.ur.length} 张 (1 UP + ${matched.ur.length} 常驻)
 * - SSR: ${matched.ssr.length} 张
 * - SR: ${matched.sr.length} 张
 * 
 * @generated 此文件由脚本自动生成 (${new Date().toISOString()})
 */

import type { RealCard } from '../../types';

const CDN_BASE = 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main';
const CARD_IMAGE_BASE = \`\${CDN_BASE}/角色卡面\`;
const POOL_IMAGE_BASE = \`\${CDN_BASE}/卡池缩略图\`;

/**
 * UP角色 (isPickup: true)
 */
export const PICKUP_CARD: RealCard = ${
    pickupCardData
      ? pickupCardData.replace(/rarity: '(\w+)' as const,/, `rarity: '$1' as const,\n  isPickup: true,`)
      : '/* 未找到 */'
  };

/**
 * 卡池内所有可抽取的卡片（不包括UP角色）
 * 包含: ${matched.ur.length} 张 UR + ${matched.ssr.length} 张 SSR + ${matched.sr.length} 张 SR
 */
export const POOL_CARDS: RealCard[] = [
  // ========== UR 卡 (${matched.ur.length} 张) ==========
${urCardsData.join(',\n  ')},

  // ========== SSR 卡 (${matched.ssr.length} 张) ==========
${ssrCardsData.join(',\n  ')},

  // ========== SR 卡 (${matched.sr.length} 张) ==========
${srCardsData.join(',\n  ')},
];

/**
 * 卡池配置
 */
export const STARRY_NIGHT_POOL = {
  id: 'starry-night',
  name: '星月夜を歩いて',
  description: '【絵空靴】杜野凛世 期间限定',
  pickupCard: PICKUP_CARD,
  cards: POOL_CARDS,
  thumbnailUrl: \`\${POOL_IMAGE_BASE}/星月夜を歩いて.webp\`,
  backgroundUrl: \`\${CARD_IMAGE_BASE}/\${encodeURIComponent(PICKUP_CARD.baseImage)}\`,
  startDate: '2025-01-01',
  endDate: '2025-02-01',
  status: 'active' as const,
};

/**
 * 卡池统计信息
 */
export const POOL_STATS = {
  total: ${allCards.length},
  ur: ${(matched.pickup ? 1 : 0) + matched.ur.length},
  ssr: ${matched.ssr.length},
  sr: ${matched.sr.length},
  pickup: 1,
};
`;

  fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf-8');
  console.log(`✅ 卡池文件已生成: ${OUTPUT_FILE}\n`);

  return { totalCards: allCards.length };
}

// 主流程
async function main() {
  console.log('=====================================');
  console.log('  生成 "星月夜を歩いて" 卡池数据');
  console.log('=====================================\n');

  try {
    // 1. 解析角色表
    const poolData = parsePoolTxt();

    // 2. 读取所有卡片
    const allCardNames = parseAllCards();

    // 3. 匹配卡片
    const { matched, notFound } = matchCards(poolData, allCardNames);

    // 4. 生成文件
    const { totalCards } = generatePoolFile(matched);

    console.log('=====================================');
    console.log('  ✅ 生成完成');
    console.log('=====================================');
    console.log(`\n总计生成: ${totalCards} 张卡面`);
    console.log(`未匹配: ${notFound.length} 张\n`);

    if (notFound.length > 0) {
      console.log('⚠️  有卡片未找到匹配，请检查卡名是否正确');
      fs.writeFileSync(path.join(__dirname, '未匹配卡片.txt'), notFound.join('\n'), 'utf-8');
      console.log('   未匹配卡片列表已保存到: 未匹配卡片.txt\n');
    }
  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

main();
