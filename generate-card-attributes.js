/**
 * 生成414张角色卡的属性数据
 * 运行: node generate-card-attributes.js
 */

const fs = require('fs');
const path = require('path');

// 读取卡片数据
const cardsModule = fs.readFileSync(
  path.join(__dirname, 'tavern_helper_template/src/偶像大师闪耀色彩-gacha/data/all-cards.ts'),
  'utf-8'
);

// 提取卡片数量（简单解析）
const cards = [];
const cardMatches = cardsModule.matchAll(/fullName:\s*'([^']+)'/g);
for (const match of cardMatches) {
  cards.push(match[1]);
}

console.log(`找到 ${cards.length} 张卡片`);

// UR卡属性（已确定）
const UR_ATTRIBUTES = {
  '【絵空靴】杜野凛世': {
    attributeType: '感性',
    stamina: 25,
    recommendedStyle: '集中',
    stats: { vocal: 95, dance: 80, visual: 75 },
  },
  '【誘爆ハートビート】黛冬優子': {
    attributeType: '非凡',
    stamina: 26,
    recommendedStyle: '全力',
    stats: { vocal: 85, dance: 90, visual: 70 },
  },
  '【アマテラス】樋口円香': {
    attributeType: '理性',
    stamina: 27,
    recommendedStyle: '好印象',
    stats: { vocal: 90, dance: 75, visual: 80 },
  },
};

// 获取品阶（从卡名推测）
function getRarity(cardName) {
  // UR卡
  if (UR_ATTRIBUTES[cardName]) return 'UR';
  
  // 简单规则：随机分配品阶
  const rand = Math.random();
  if (rand < 0.7) return 'SSR';
  if (rand < 0.9) return 'SR';
  return 'R';
}

// 获取品阶范围
function getRarityRange(rarity) {
  switch (rarity) {
    case 'UR':
      return { staminaRange: [25, 27], statsRange: [245, 250] };
    case 'SSR':
      return { staminaRange: [26, 30], statsRange: [220, 245] };
    case 'SR':
      return { staminaRange: [30, 34], statsRange: [200, 225] };
    case 'R':
      return { staminaRange: [32, 35], statsRange: [180, 205] };
    default:
      return { staminaRange: [28, 32], statsRange: [200, 230] };
  }
}

// 随机属性类型（均匀分配）
function randomAttributeType(index) {
  // 简单轮流分配：理性 -> 感性 -> 非凡 -> 理性 ...
  const types = ['理性', '感性', '非凡'];
  return types[index % 3];
}

// 随机流派
function randomRecommendedStyle(attributeType, seed) {
  const styleMap = {
    '理性': ['好印象', '干劲'],
    '感性': ['好调', '集中'],
    '非凡': ['坚决', '全力'],
  };
  const styles = styleMap[attributeType];
  return styles[Math.floor((Math.sin(seed * 5.678) + 1) * 1) % 2];
}

// 生成三维
function generateStats(totalStats, seed) {
  const attributes = ['vocal', 'dance', 'visual'];
  
  // 主属性: 35-40%
  const mainValue = Math.floor((totalStats * (0.35 + (Math.sin(seed * 2.345) + 1) * 0.025)) / 5) * 5;
  
  // 副属性和差属性
  const remaining = totalStats - mainValue;
  const subValue = Math.floor((remaining * (0.5 + (Math.sin(seed * 3.456) + 1) * 0.05)) / 5) * 5;
  const weakValue = remaining - subValue;
  
  // 随机分配到三个属性
  const values = [mainValue, subValue, weakValue];
  values.sort(() => Math.sin(seed * 4.567) - 0.5);
  
  return {
    vocal: values[0],
    dance: values[1],
    visual: values[2],
  };
}

// 生成所有卡片属性
const cardAttributes = {};
const stats = {
  total: cards.length,
  byAttribute: { '理性': 0, '感性': 0, '非凡': 0 },
  byRarity: { UR: 0, SSR: 0, SR: 0, R: 0 },
};

cards.forEach((cardName, index) => {
  // 检查是否是UR卡
  if (UR_ATTRIBUTES[cardName]) {
    cardAttributes[cardName] = UR_ATTRIBUTES[cardName];
    stats.byAttribute[UR_ATTRIBUTES[cardName].attributeType]++;
    stats.byRarity.UR++;
    return;
  }
  
  const rarity = getRarity(cardName);
  const range = getRarityRange(rarity);
  
  // 生成体力
  const seed = index * 123.456;
  const staminaRange = range.staminaRange[1] - range.staminaRange[0];
  const stamina = range.staminaRange[0] + Math.floor((Math.sin(seed) + 1) * 0.5 * staminaRange);
  
  // 根据体力反向计算三维
  const staminaNormalized = (stamina - range.staminaRange[0]) / staminaRange;
  const statsTotal = Math.floor(range.statsRange[1] - staminaNormalized * (range.statsRange[1] - range.statsRange[0]));
  const adjustedTotal = Math.floor(statsTotal / 5) * 5;
  
  // 属性类型（轮流分配，保证均匀）
  const attributeType = randomAttributeType(index);
  
  const recommendedStyle = randomRecommendedStyle(attributeType, seed);
  const statsObj = generateStats(adjustedTotal, seed);
  
  cardAttributes[cardName] = {
    attributeType,
    stamina,
    recommendedStyle,
    stats: statsObj,
  };
  
  stats.byAttribute[attributeType]++;
  stats.byRarity[rarity]++;
});

// 输出统计
console.log('\n=== 属性生成统计 ===');
console.log(`总卡片数: ${stats.total}`);
console.log('\n按属性类型:');
console.log(`  理性: ${stats.byAttribute['理性']}`);
console.log(`  感性: ${stats.byAttribute['感性']}`);
console.log(`  非凡: ${stats.byAttribute['非凡']}`);
console.log('\n按品阶:');
console.log(`  UR: ${stats.byRarity.UR}`);
console.log(`  SSR: ${stats.byRarity.SSR}`);
console.log(`  SR: ${stats.byRarity.SR}`);
console.log(`  R: ${stats.byRarity.R}`);

// 保存为JSON
const outputPath = path.join(__dirname, 'tavern_helper_template/src/偶像大师闪耀色彩-gacha/data/card-attributes.json');
fs.writeFileSync(outputPath, JSON.stringify(cardAttributes, null, 2), 'utf-8');

console.log(`\n✅ 属性数据已保存到: ${outputPath}`);

// 创建TypeScript导出文件
const tsContent = `/**
 * 角色卡属性数据库
 * 自动生成于 ${new Date().toISOString()}
 * 总计: ${stats.total} 张卡片
 */

import type { CardAttribute } from './card-attributes-types';
import attributesData from './card-attributes.json';

export const CARD_ATTRIBUTES: Record<string, CardAttribute> = attributesData as any;

/**
 * 根据卡片全名获取属性
 */
export function getCardAttribute(fullCardName: string): CardAttribute | undefined {
  return CARD_ATTRIBUTES[fullCardName];
}

/**
 * 统计信息
 */
export const ATTRIBUTE_STATS = ${JSON.stringify(stats, null, 2)};
`;

const tsPath = path.join(__dirname, 'tavern_helper_template/src/偶像大师闪耀色彩-gacha/data/card-attributes.ts');
fs.writeFileSync(tsPath, tsContent, 'utf-8');

console.log(`✅ TypeScript文件已保存到: ${tsPath}`);
console.log('\n🎉 完成！');

