const fs = require('fs');
const path = require('path');

console.log('=====================================');
console.log('  补充缺失卡面');
console.log('=====================================');

const cardsJsonPath = path.join(__dirname, '卡面库-最终版.json');
const gitImagesDir = path.join(__dirname, '闪耀色彩图片-最终版');
const localImagesDir = 'E:\\BaiduNetdiskDownload\\闪耀色彩';

// 读取当前卡面数据
let cardsData = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
let cards = cardsData.cards;

console.log(`\n📦 当前数据: ${cards.length} 张卡面`);

// 备份
const backupPath = path.join(__dirname, '卡面库-最终版.backup-before-supplement.json');
fs.copyFileSync(cardsJsonPath, backupPath);
console.log(`💾 已备份到: ${backupPath}`);

// ============================================
// 第一步: 品阶纠正
// ============================================
console.log('\n\n📝 第一步: 品阶纠正');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const rarityCorrections = [
  { theme: 'なつやすみ学校', char: '福丸小糸', from: 'SR', to: 'SSR' },
];

let correctedCount = 0;
for (const correction of rarityCorrections) {
  const card = cards.find(c => c.themeName === correction.theme && c.characterName === correction.char);
  if (card) {
    if (card.rarity === correction.from) {
      card.rarity = correction.to;
      console.log(`✅ ${card.fullName}: ${correction.from} → ${correction.to}`);
      correctedCount++;
    } else {
      console.log(`⚠️ ${card.fullName}: 当前已是 ${card.rarity}`);
    }
  } else {
    console.log(`❌ 未找到: 【${correction.theme}】${correction.char}`);
  }
}
console.log(`\n品阶纠正完成: ${correctedCount} 张`);

// ============================================
// 第二步: 检查Git库中的卡面文件
// ============================================
console.log('\n\n📂 第二步: 检查Git库中已存在的卡面');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const gitExistingCards = [
  { theme: '淡雪の戯れ', char: '風野灯織', rarity: 'SSR' },
  { theme: '伸ばす手に乗せるのは', char: '風野灯織', rarity: 'SSR' },
  { theme: 'つづく、', char: '浅倉透', rarity: 'SSR' },
  { theme: 'てのひらの答え', char: '福丸小糸', rarity: 'SSR' },
];

let foundInGit = 0;
let notFoundInGit = [];

for (const cardInfo of gitExistingCards) {
  const baseFileName = `${cardInfo.theme} ${cardInfo.char}.webp`;
  const awakenedFileName = `${cardInfo.theme} ${cardInfo.char}+.webp`;
  const basePath = path.join(gitImagesDir, baseFileName);
  const awakenedPath = path.join(gitImagesDir, awakenedFileName);

  const baseExists = fs.existsSync(basePath);
  const awakenedExists = fs.existsSync(awakenedPath);

  if (baseExists && awakenedExists) {
    console.log(`✅ Git库中找到: 【${cardInfo.theme}】${cardInfo.char}`);
    console.log(`   基础图: ${baseFileName}`);
    console.log(`   觉醒图: ${awakenedFileName}`);

    // 检查是否已在角色表中
    const existsInData = cards.some(c => c.themeName === cardInfo.theme && c.characterName === cardInfo.char);
    if (existsInData) {
      console.log(`   ⚠️ 已存在于角色表中`);
    } else {
      // 添加到角色表
      const newCard = {
        fullName: `【${cardInfo.theme}】${cardInfo.char}`,
        themeName: cardInfo.theme,
        characterName: cardInfo.char,
        baseImage: baseFileName,
        awakenedImage: awakenedFileName,
        rarity: cardInfo.rarity,
      };
      cards.push(newCard);
      console.log(`   ✅ 已添加到角色表`);
      foundInGit++;
    }
  } else {
    console.log(`❌ Git库中未找到: 【${cardInfo.theme}】${cardInfo.char}`);
    if (!baseExists) console.log(`   缺少基础图: ${baseFileName}`);
    if (!awakenedExists) console.log(`   缺少觉醒图: ${awakenedFileName}`);
    notFoundInGit.push(cardInfo);
  }
  console.log('');
}

console.log(`Git库中找到并添加: ${foundInGit} 张`);

// ============================================
// 第三步: 需要用户补充的卡面
// ============================================
console.log('\n\n📋 第三步: 需要用户手动补充的卡面');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const needUserAction = [
  {
    theme: '柔らかな微笑み',
    char: '風野灯織',
    rarity: 'SSR',
    status: '无图，现已下载，需要压缩后重新上传',
  },
  {
    theme: '途方もない午後',
    char: '浅倉透',
    rarity: 'SSR',
    status: 'git无图，本地有图，需重新压缩并上传',
  },
  {
    theme: 'オイサラバエル',
    char: '樋口円香',
    rarity: 'SSR',
    status: 'git无图，本地有图，需重新压缩并上传',
  },
  {
    theme: 'Merry',
    char: '樋口円香',
    rarity: 'SSR',
    status: 'git无图，本地有图，需重新压缩并上传',
  },
  {
    theme: 'ダウト',
    char: '樋口円香',
    rarity: 'SR',
    status: 'git无图，本地有图，需重新压缩并上传',
  },
  {
    theme: 'カラメル',
    char: '樋口円香',
    rarity: 'SR',
    status: 'git无图，本地有图，需重新压缩并上传',
  },
  {
    theme: 'S!GNATURE',
    char: '市川雛菜',
    rarity: 'SSR',
    status: 'git无图，本地有图，需重新压缩并上传',
  },
  {
    theme: 'DE-S!GN',
    char: '市川雛菜',
    rarity: 'SSR',
    status: 'git无图，本地有图，需重新压缩并上传',
  },
];

console.log(`共需补充 ${needUserAction.length} 张卡面：\n`);

const ssrNeed = needUserAction.filter(c => c.rarity === 'SSR');
const srNeed = needUserAction.filter(c => c.rarity === 'SR');

console.log(`【SSR卡 (${ssrNeed.length}张)】:`);
ssrNeed.forEach((card, index) => {
  console.log(`   ${index + 1}) 【${card.theme}】${card.char}`);
  console.log(`      ${card.status}`);
});

console.log(`\n【SR卡 (${srNeed.length}张)】:`);
srNeed.forEach((card, index) => {
  console.log(`   ${index + 1}) 【${card.theme}】${card.char}`);
  console.log(`      ${card.status}`);
});

// ============================================
// 保存更新后的数据
// ============================================
console.log('\n\n💾 保存更新...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

cardsData.cards = cards;
cardsData.totalCards = cards.length;
fs.writeFileSync(cardsJsonPath, JSON.stringify(cardsData, null, 2), 'utf8');

console.log(`\n✅ 更新完成！`);
console.log(`   品阶纠正: ${correctedCount} 张`);
console.log(`   从Git库添加: ${foundInGit} 张`);
console.log(`   当前总卡面数: ${cards.length} 张`);
console.log(`   等待用户补充: ${needUserAction.length} 张`);

// ============================================
// 品阶统计
// ============================================
console.log('\n\n📊 最新品阶统计');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

















