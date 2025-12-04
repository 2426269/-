const fs = require('fs');
const path = require('path');

console.log('=====================================');
console.log('  添加Git库中已有的卡面');
console.log('=====================================');

const cardsJsonPath = path.join(__dirname, '卡面库-最终版.json');
const cardsDir = path.join(__dirname, '闪耀色彩图片-最终版', '角色卡面');

// 读取当前卡面数据
let cardsData = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
let cards = cardsData.cards;

console.log(`\n📦 当前数据: ${cards.length} 张卡面`);

// 备份
const backupPath = path.join(__dirname, '卡面库-最终版.backup-add-git-existing.json');
fs.copyFileSync(cardsJsonPath, backupPath);
console.log(`💾 已备份到: ${backupPath}`);

// Git库中实际存在的卡面文件（从搜索结果中获取的准确文件名）
const gitExistingCards = [
  {
    baseImage: 'つづく、浅倉透.webp',
    awakenedImage: 'つづく、浅倉透+.webp',
    themeName: 'つづく、',
    characterName: '浅倉透',
    rarity: 'SSR',
  },
  {
    baseImage: 'ての ひらの答え 福丸小糸+.webp', // 注意：基础图和觉醒图文件名不一致
    awakenedImage: 'てのひらの答え 福丸小糸 .webp',
    themeName: 'てのひらの答え',
    characterName: '福丸小糸',
    rarity: 'SSR',
    note: '文件名有空格差异，需要手动选择',
  },
];

// 特殊处理：淡雪の戯れ（文件名有多余空格）
// 实际Git文件: 淡雪の戯れ  風野灯織 .webp 和 淡雪の戯れ 風野灯織+.webp
// 这个需要检查实际哪个是基础图哪个是觉醒图

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 第一步: 检查Git库中的文件');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 列出所有待处理的卡面
const allFiles = fs.readdirSync(cardsDir);

// 检查 淡雪の戯れ
console.log('【淡雪の戯れ 風野灯織】');
const awayukiFiles = allFiles.filter(f => f.includes('淡雪'));
awayukiFiles.forEach(f => console.log(`   ${f}`));

// 从文件名判断哪个是基础图
let awayukiBase = awayukiFiles.find(f => !f.includes('+'));
let awayukiAwakened = awayukiFiles.find(f => f.includes('+'));

if (awayukiBase && awayukiAwakened) {
  gitExistingCards.push({
    baseImage: awayukiBase,
    awakenedImage: awayukiAwakened,
    themeName: '淡雪の戯れ',
    characterName: '風野灯織',
    rarity: 'SSR',
  });
  console.log(`   ✅ 基础图: ${awayukiBase}`);
  console.log(`   ✅ 觉醒图: ${awayukiAwakened}`);
}

// 检查 てのひらの答え
console.log('\n【てのひらの答え 福丸小糸】');
const tenoFiles = allFiles.filter(f => f.includes('てのひら') || f.includes('ての ひら'));
tenoFiles.forEach(f => console.log(`   ${f}`));

let tenoBase = tenoFiles.find(f => !f.includes('+'));
let tenoAwakened = tenoFiles.find(f => f.includes('+'));

if (tenoBase && tenoAwakened) {
  // 更新之前添加的记录
  const tenoCard = gitExistingCards.find(c => c.themeName === 'てのひらの答え');
  if (tenoCard) {
    tenoCard.baseImage = tenoBase;
    tenoCard.awakenedImage = tenoAwakened;
  }
  console.log(`   ✅ 基础图: ${tenoBase}`);
  console.log(`   ✅ 觉醒图: ${tenoAwakened}`);
}

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 第二步: 添加卡面到角色表');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let addedCount = 0;

for (const cardInfo of gitExistingCards) {
  // 检查是否已存在
  const exists = cards.some(
    c => c.themeName === cardInfo.themeName && c.characterName === cardInfo.characterName
  );

  if (exists) {
    console.log(`⚠️ 已存在: 【${cardInfo.themeName}】${cardInfo.characterName}`);
    continue;
  }

  // 添加新卡面
  const newCard = {
    fullName: `【${cardInfo.themeName}】${cardInfo.characterName}`,
    themeName: cardInfo.themeName,
    characterName: cardInfo.characterName,
    baseImage: cardInfo.baseImage,
    awakenedImage: cardInfo.awakenedImage,
    rarity: cardInfo.rarity,
  };

  cards.push(newCard);
  console.log(`✅ 已添加: ${newCard.fullName} (${cardInfo.rarity})`);
  console.log(`   基础图: ${cardInfo.baseImage}`);
  console.log(`   觉醒图: ${cardInfo.awakenedImage}`);
  addedCount++;
}

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 第三步: 品阶纠正');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 纠正【なつやすみ学校】福丸小糸的品阶
const natsuCard = cards.find(
  c =>
    c.characterName === '福丸小糸' &&
    (c.themeName.includes('なつやすみ学校') || c.themeName.includes('なつ やすみ学校'))
);

let correctedCount = 0;
if (natsuCard) {
  if (natsuCard.rarity !== 'SSR') {
    const oldRarity = natsuCard.rarity;
    natsuCard.rarity = 'SSR';
    console.log(`✅ 纠正: ${natsuCard.fullName}`);
    console.log(`   ${oldRarity} → SSR`);
    correctedCount++;
  } else {
    console.log(`⚠️ 【${natsuCard.themeName}】福丸小糸 已是 SSR`);
  }
} else {
  console.log(`❌ 未找到【なつやすみ学校】福丸小糸`);
}

// 保存
console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💾 保存更新');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

cardsData.cards = cards;
cardsData.totalCards = cards.length;
fs.writeFileSync(cardsJsonPath, JSON.stringify(cardsData, null, 2), 'utf8');

console.log(`✅ 更新完成！`);
console.log(`   添加卡面: ${addedCount} 张`);
console.log(`   品阶纠正: ${correctedCount} 张`);
console.log(`   当前总卡面数: ${cards.length} 张`);

// 品阶统计
console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 最新品阶统计');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const stats = { UR: 0, SSR: 0, SR: 0 };
cards.forEach(c => stats[c.rarity]++);

console.log(`   UR:  ${stats.UR} 张 (${((stats.UR / cards.length) * 100).toFixed(2)}%)`);
console.log(`   SSR: ${stats.SSR} 张 (${((stats.SSR / cards.length) * 100).toFixed(2)}%)`);
console.log(`   SR:  ${stats.SR} 张 (${((stats.SR / cards.length) * 100).toFixed(2)}%)`);
console.log(`   总计: ${cards.length} 张`);

console.log('\n🎉 完成！');

















