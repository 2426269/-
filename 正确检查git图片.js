const fs = require('fs');
const path = require('path');

console.log('=====================================');
console.log('  检查Git库中的卡面图片');
console.log('=====================================');

// Git仓库克隆到本地的路径（需要用户确认实际路径）
const gitRepoPath = 'E:\\偶像大师\\闪耀色彩图片-最终版';
const cardsDir = path.join(gitRepoPath, '角色卡面');

console.log(`\n📂 检查目录: ${cardsDir}`);

if (!fs.existsSync(cardsDir)) {
  console.error(`\n❌ 错误: 目录不存在`);
  console.log(`\n💡 提示:`);
  console.log(`   1. 请确认Git仓库已克隆到本地`);
  console.log(`   2. 或修改脚本中的 gitRepoPath 为正确路径`);
  console.log(`\n当前检查路径: ${cardsDir}`);
  process.exit(1);
}

// 读取卡面库数据
const cardsJsonPath = path.join(__dirname, '卡面库-最终版.json');
let cardsData = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
let cards = cardsData.cards;

console.log(`\n📦 当前角色表: ${cards.length} 张卡面`);

// 需要检查的卡面（用户说Git已有图的）
const cardsToCheck = [
  { theme: '淡雪の戯れ', char: '風野灯織', rarity: 'SSR' },
  { theme: '伸ばす手に乗せるのは', char: '風野灯織', rarity: 'SSR' },
  { theme: 'つづく、', char: '浅倉透', rarity: 'SSR' },
  { theme: 'てのひらの答え', char: '福丸小糸', rarity: 'SSR' },
];

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 检查Git库中的卡面文件');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const foundCards = [];
const notFoundCards = [];

for (const cardInfo of cardsToCheck) {
  const baseFileName = `${cardInfo.theme} ${cardInfo.char}.webp`;
  const awakenedFileName = `${cardInfo.theme} ${cardInfo.char}+.webp`;
  const basePath = path.join(cardsDir, baseFileName);
  const awakenedPath = path.join(cardsDir, awakenedFileName);

  const baseExists = fs.existsSync(basePath);
  const awakenedExists = fs.existsSync(awakenedPath);

  console.log(`【${cardInfo.theme}】${cardInfo.char} (${cardInfo.rarity})`);
  console.log(`   基础图: ${baseExists ? '✅' : '❌'} ${baseFileName}`);
  console.log(`   觉醒图: ${awakenedExists ? '✅' : '❌'} ${awakenedFileName}`);

  if (baseExists && awakenedExists) {
    // 检查是否已在角色表中
    const existsInData = cards.some(
      c => c.themeName === cardInfo.theme && c.characterName === cardInfo.char
    );

    if (existsInData) {
      console.log(`   ⚠️ 已存在于角色表中，无需添加`);
    } else {
      console.log(`   ✅ Git有图但角色表缺失，需要添加！`);
      foundCards.push({
        fullName: `【${cardInfo.theme}】${cardInfo.char}`,
        themeName: cardInfo.theme,
        characterName: cardInfo.char,
        baseImage: baseFileName,
        awakenedImage: awakenedFileName,
        rarity: cardInfo.rarity,
      });
    }
  } else {
    console.log(`   ❌ Git库中图片不完整`);
    notFoundCards.push(cardInfo);
  }
  console.log('');
}

// 总结
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 检查结果总结');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`✅ Git有图且需添加到角色表: ${foundCards.length} 张`);
console.log(`❌ Git库中图片不完整: ${notFoundCards.length} 张\n`);

if (foundCards.length > 0) {
  console.log('需要添加的卡面：');
  foundCards.forEach((card, index) => {
    console.log(`   ${index + 1}) ${card.fullName} (${card.rarity})`);
  });
}

if (notFoundCards.length > 0) {
  console.log('\nGit库中图片不完整的卡面：');
  notFoundCards.forEach((card, index) => {
    console.log(`   ${index + 1}) 【${card.theme}】${card.char} (${card.rarity})`);
  });
}

// 如果有需要添加的卡面，更新JSON文件
if (foundCards.length > 0) {
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💾 更新角色表');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 备份
  const backupPath = path.join(__dirname, '卡面库-最终版.backup-add-git-cards.json');
  fs.copyFileSync(cardsJsonPath, backupPath);
  console.log(`✅ 已备份到: ${backupPath}`);

  // 添加新卡面
  cards.push(...foundCards);
  cardsData.cards = cards;
  cardsData.totalCards = cards.length;

  // 保存
  fs.writeFileSync(cardsJsonPath, JSON.stringify(cardsData, null, 2), 'utf8');
  console.log(`✅ 已添加 ${foundCards.length} 张卡面到角色表`);
  console.log(`📊 新的总卡面数: ${cards.length} 张`);

  // 品阶统计
  const stats = { UR: 0, SSR: 0, SR: 0 };
  cards.forEach(c => stats[c.rarity]++);
  console.log('\n📊 最新品阶分布：');
  console.log(`   UR:  ${stats.UR} 张 (${((stats.UR / cards.length) * 100).toFixed(2)}%)`);
  console.log(`   SSR: ${stats.SSR} 张 (${((stats.SSR / cards.length) * 100).toFixed(2)}%)`);
  console.log(`   SR:  ${stats.SR} 张 (${((stats.SR / cards.length) * 100).toFixed(2)}%)`);
}

console.log('\n🎉 完成！');











