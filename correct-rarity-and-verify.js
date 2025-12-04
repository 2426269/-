const fs = require('fs');
const path = require('path');

console.log('=====================================');
console.log('  纠正品阶并验证SSR数量');
console.log('=====================================');

const cardsJsonPath = path.join(__dirname, '卡面库-最终版.json');
const correctionsPath = 'C:\\Users\\33987\\Desktop\\新建 文本文档.txt';

// 读取纠正列表
const corrections = {};
const toRemove = [];

const correctionsContent = fs.readFileSync(correctionsPath, 'utf8');
const lines = correctionsContent.split('\n');

console.log('\n📖 解析纠正列表...');
for (const line of lines) {
  const match = line.match(/【(.+?)】(.+?)\s+(ssr|sr|不存在这个角色卡，移除)/i);
  if (match) {
    const themeName = match[1];
    const charName = match[2].trim();
    const action = match[3].toLowerCase();

    if (action.includes('移除')) {
      toRemove.push(themeName);
      console.log(`   ❌ 标记删除: ${themeName}`);
    } else {
      corrections[themeName] = action.toUpperCase();
      console.log(`   ✏️ ${themeName} -> ${action.toUpperCase()}`);
    }
  }
}

// 读取卡面数据
let cardsData = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
let cards = cardsData.cards;

console.log(`\n📦 原始数据: ${cards.length} 张卡面`);

// 备份
const backupPath = path.join(__dirname, '卡面库-最终版.backup-before-correction.json');
fs.copyFileSync(cardsJsonPath, backupPath);
console.log(`💾 已备份到: ${backupPath}`);

// 应用纠正
let correctedCount = 0;
let removedCount = 0;

cards = cards.filter(card => {
  const themeName = card.themeName;

  // 检查是否需要删除
  if (toRemove.includes(themeName)) {
    console.log(`\n🗑️ 删除: ${card.fullName}`);
    removedCount++;
    return false;
  }

  // 检查是否需要纠正品阶
  if (corrections[themeName]) {
    const oldRarity = card.rarity;
    const newRarity = corrections[themeName];
    if (oldRarity !== newRarity) {
      card.rarity = newRarity;
      console.log(`\n✏️ 纠正: ${card.fullName}`);
      console.log(`   ${oldRarity} -> ${newRarity}`);
      correctedCount++;
    }
  }

  return true;
});

console.log(`\n✅ 纠正完成！`);
console.log(`   纠正品阶: ${correctedCount} 张`);
console.log(`   删除卡面: ${removedCount} 张`);
console.log(`   剩余卡面: ${cards.length} 张`);

// 更新数据
cardsData.cards = cards;
cardsData.totalCards = cards.length;
fs.writeFileSync(cardsJsonPath, JSON.stringify(cardsData, null, 2), 'utf8');
console.log(`\n💾 已保存更新`);

// 统计各角色SSR数量
console.log('\n📊 统计各角色SSR数量...');

const characterSSRCount = {};
const characterAllCards = {};

for (const card of cards) {
  const char = card.characterName;
  if (!characterSSRCount[char]) {
    characterSSRCount[char] = 0;
    characterAllCards[char] = [];
  }

  characterAllCards[char].push({
    fullName: card.fullName,
    theme: card.themeName,
    rarity: card.rarity,
  });

  if (card.rarity === 'SSR') {
    characterSSRCount[char]++;
  }
}

// 用户提供的正确SSR数量
const expectedSSRCount = {
  櫻木真乃: 12,
  風野灯織: 13,
  八宮めぐる: 12,
  月岡恋鐘: 13,
  田中摩美々: 13,
  白瀬咲耶: 12,
  三峰結華: 12,
  幽谷霧子: 12,
  小宮果穂: 13,
  園田智代子: 12,
  西城樹里: 12,
  杜野凛世: 13,
  有栖川夏葉: 13,
  大崎甘奈: 13,
  大崎甜花: 12,
  桑山千雪: 12,
  芹沢あさひ: 11,
  黛冬優子: 11,
  和泉愛依: 11,
  浅倉透: 10,
  樋口円香: 9,
  福丸小糸: 10,
  市川雛菜: 10,
  七草にちか: 9,
  緋田美琴: 9,
  斑鳩ルカ: 7,
  鈴木羽那: 5,
  郁田はるき: 5,
};

console.log('\n📋 SSR数量对比：');
console.log('角色名 | 实际 | 应有 | 状态');
console.log('-------|------|------|------');

const issues = [];

for (const char in expectedSSRCount) {
  const actual = characterSSRCount[char] || 0;
  const expected = expectedSSRCount[char];
  const diff = actual - expected;

  let status = '✅';
  if (diff > 0) {
    status = `❌ 多${diff}`;
    issues.push({ char, actual, expected, type: 'more', diff });
  } else if (diff < -1) {
    // 少1个可以接受，少2个以上才报告
    status = `⚠️ 少${-diff}`;
    issues.push({ char, actual, expected, type: 'less', diff });
  } else if (diff === -1) {
    status = `⚡ 少1`;
  }

  console.log(`${char} | ${actual} | ${expected} | ${status}`);
}

// 报告问题
if (issues.length > 0) {
  console.log('\n⚠️ 发现数量异常的角色：');

  for (const issue of issues) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n角色: ${issue.char}`);
    console.log(
      `实际SSR: ${issue.actual} | 应有SSR: ${issue.expected} | 差异: ${issue.diff > 0 ? '+' : ''}${issue.diff}`,
    );
    console.log(`\n该角色所有卡面列表:`);

    const charCards = characterAllCards[issue.char];
    const ssrCards = charCards.filter(c => c.rarity === 'SSR');
    const srCards = charCards.filter(c => c.rarity === 'SR');
    const urCards = charCards.filter(c => c.rarity === 'UR');

    if (urCards.length > 0) {
      console.log(`\n【UR卡 (${urCards.length}张)】:`);
      urCards.forEach((card, index) => {
        console.log(`   ${index + 1}) ${card.fullName}`);
      });
    }

    console.log(`\n【SSR卡 (${ssrCards.length}张)】:`);
    ssrCards.forEach((card, index) => {
      console.log(`   ${index + 1}) ${card.fullName}`);
    });

    console.log(`\n【SR卡 (${srCards.length}张)】:`);
    srCards.forEach((card, index) => {
      console.log(`   ${index + 1}) ${card.fullName}`);
    });
  }
} else {
  console.log('\n✅ 所有角色的SSR数量都正常！');
}

// 最终统计
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📊 最终品阶统计：');
const finalStats = {
  UR: 0,
  SSR: 0,
  SR: 0,
};

for (const card of cards) {
  finalStats[card.rarity]++;
}

console.log(`   UR:  ${finalStats.UR} 张 (${((finalStats.UR / cards.length) * 100).toFixed(2)}%)`);
console.log(`   SSR: ${finalStats.SSR} 张 (${((finalStats.SSR / cards.length) * 100).toFixed(2)}%)`);
console.log(`   SR:  ${finalStats.SR} 张 (${((finalStats.SR / cards.length) * 100).toFixed(2)}%)`);
console.log(`   总计: ${cards.length} 张`);

console.log('\n🎉 完成！');










