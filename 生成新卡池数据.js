/**
 * 基于真实卡面数据生成新的卡池配置
 */

const fs = require('fs');

// 读取卡面数据
const cardsData = JSON.parse(fs.readFileSync('E:\\偶像大师\\卡面库-最终版.json', 'utf8'));
const charactersData = JSON.parse(fs.readFileSync('E:\\偶像大师\\角色库-最终版.json', 'utf8'));

console.log('=====================================');
console.log('  生成新卡池数据');
console.log('=====================================');
console.log('');
console.log(`📖 读取卡面数据: ${cardsData.totalCards} 张`);
console.log(`📖 读取角色数据: ${charactersData.totalCharacters} 位`);
console.log('');

// 生成 CHARACTERS 数据
const characters = {};
charactersData.characters.forEach(char => {
  if (char.name) {
    // 跳过空名字
    characters[char.name] = {
      name: char.name,
      rarity: ['SSR', 'SR', 'R'], // 默认都可能出现
    };
  }
});

console.log(`✅ 生成角色数据: ${Object.keys(characters).length} 位`);

// 生成 AVAILABLE_CARDS 数据
const availableCards = cardsData.cards.map(card => ({
  name: card.fullName,
  character: card.characterName,
  theme: card.themeName,
  rarity: 'SSR', // 默认都是 SSR，可以后续手动调整
  baseImage: card.baseImage.replace('.webp', ''),
  awakenedImage: card.awakenedImage.replace('.webp', ''),
}));

console.log(`✅ 生成卡面数据: ${availableCards.length} 张`);
console.log('');

// 保存为 TypeScript 格式
const tsOutput = `/**
 * 角色和卡面数据（基于真实资源生成）
 * 生成时间: ${new Date().toISOString()}
 * 总角色数: ${Object.keys(characters).length}
 * 总卡面数: ${availableCards.length}
 */

import { Character, CardConfig } from '../types';

// 所有角色
export const CHARACTERS: Record<string, Character> = ${JSON.stringify(characters, null, 2)};

// 所有可用卡面
export const AVAILABLE_CARDS: CardConfig[] = ${JSON.stringify(availableCards, null, 2)};

// 按稀有度分组
export const CARDS_BY_RARITY = {
  SSR: AVAILABLE_CARDS.filter(c => c.rarity === 'SSR'),
  SR: AVAILABLE_CARDS.filter(c => c.rarity === 'SR'),
  R: AVAILABLE_CARDS.filter(c => c.rarity === 'R'),
};

// 按角色分组
export const CARDS_BY_CHARACTER: Record<string, CardConfig[]> = {};
for (const card of AVAILABLE_CARDS) {
  if (!CARDS_BY_CHARACTER[card.character]) {
    CARDS_BY_CHARACTER[card.character] = [];
  }
  CARDS_BY_CHARACTER[card.character].push(card);
}

// 统计信息
export const STATS = {
  totalCharacters: ${Object.keys(characters).length},
  totalCards: ${availableCards.length},
  cardsByRarity: {
    SSR: CARDS_BY_RARITY.SSR.length,
    SR: CARDS_BY_RARITY.SR.length,
    R: CARDS_BY_RARITY.R.length,
  },
};
`;

// 保存文件
const outputPath = 'E:\\偶像大师\\tavern_helper_template\\src\\偶像大师闪耀色彩-gacha\\data\\cards-data-new.ts';
fs.writeFileSync(outputPath, tsOutput, 'utf8');

console.log('💾 已保存到:');
console.log(`   ${outputPath}`);
console.log('');

// 显示统计
console.log('📊 统计信息:');
console.log(`   角色数: ${Object.keys(characters).length} 位`);
console.log(`   卡面数: ${availableCards.length} 张`);
console.log(`   SSR: ${availableCards.filter(c => c.rarity === 'SSR').length} 张`);
console.log('');

// 显示部分角色（有最多卡面的）
const charCardCounts = {};
availableCards.forEach(card => {
  charCardCounts[card.character] = (charCardCounts[card.character] || 0) + 1;
});

const topChars = Object.entries(charCardCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log('🏆 卡面数量排行（前10位）:');
topChars.forEach(([name, count], index) => {
  console.log(`   ${index + 1}. ${name} - ${count} 张`);
});

console.log('');
console.log('🎉 生成完成！');
console.log('');
console.log('📝 下一步:');
console.log('   1. 检查生成的文件');
console.log('   2. 如需要，手动调整卡面稀有度');
console.log('   3. 替换旧的卡池数据文件');









