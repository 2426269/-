const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

console.log('=====================================');
console.log('  补充新卡面完整流程');
console.log('=====================================');

const localImagesDir = 'E:\\BaiduNetdiskDownload\\闪耀色彩';
const outputDir = path.join(__dirname, '闪耀色彩图片-最终版', '角色卡面');
const cardsJsonPath = path.join(__dirname, '卡面库-最终版.json');

// 需要补充的卡面（从用户提供的信息）
const newCards = [
  // 風野灯織 - 2张SSR
  { theme: '柔らかな微笑み', char: '風野灯織', rarity: 'SSR' },
  { theme: '伸ばす手に乗せるのは', char: '風野灯織', rarity: 'SSR' },
  
  // 浅倉透 - 1张SSR
  { theme: '途方もない午後', char: '浅倉透', rarity: 'SSR' },
  
  // 樋口円香 - 2张SSR + 2张SR
  { theme: 'オイサラバエル', char: '樋口円香', rarity: 'SSR' },
  { theme: 'Merry', char: '樋口円香', rarity: 'SSR' },
  { theme: 'ダウト', char: '樋口円香', rarity: 'SR' },
  { theme: 'カラメル', char: '樋口円香', rarity: 'SR' },
  
  // 市川雛菜 - 2张SSR
  { theme: 'S!GNATURE', char: '市川雛菜', rarity: 'SSR' },
  { theme: 'DE-S!GN', char: '市川雛菜', rarity: 'SSR' },
];

// 压缩配置
const QUALITY = 85;

console.log(`\n📂 源目录: ${localImagesDir}`);
console.log(`📂 输出目录: ${outputDir}\n`);

// ============================================
// 第一步: 扫描本地图片
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 第一步: 扫描本地图片');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!fs.existsSync(localImagesDir)) {
  console.error(`❌ 错误: 源目录不存在: ${localImagesDir}`);
  process.exit(1);
}

// 递归搜索所有图片文件
function searchFiles(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results.push(...searchFiles(filePath));
    } else if (/\.(png|jpg|jpeg)$/i.test(file)) {
      results.push(filePath);
    }
  }
  
  return results;
}

console.log('🔍 正在递归搜索所有图片文件...\n');
const allLocalFiles = searchFiles(localImagesDir);
console.log(`📊 本地共 ${allLocalFiles.length} 个图片文件\n`);

const foundCards = [];
const notFoundCards = [];

for (const cardInfo of newCards) {
  console.log(`🔍 搜索: 【${cardInfo.theme}】${cardInfo.char} (${cardInfo.rarity})`);
  
  // 搜索包含主题名和角色名的文件
  const matchingFiles = allLocalFiles.filter(f => {
    const fileName = path.basename(f);
    return fileName.includes(cardInfo.theme) && fileName.includes(cardInfo.char);
  });
  
  let baseFile = null;
  let awakenedFile = null;
  
  if (matchingFiles.length > 0) {
    baseFile = matchingFiles.find(f => !f.includes('+'));
    awakenedFile = matchingFiles.find(f => f.includes('+'));
  }
  
  if (baseFile && awakenedFile) {
    console.log(`   ✅ 找到配对`);
    console.log(`      基础图: ${baseFile}`);
    console.log(`      觉醒图: ${awakenedFile}`);
    foundCards.push({
      ...cardInfo,
      baseFile,
      awakenedFile,
    });
  } else {
    console.log(`   ❌ 未找到完整配对`);
    if (baseFile) console.log(`      基础图: ${baseFile}`);
    if (awakenedFile) console.log(`      觉醒图: ${awakenedFile}`);
    notFoundCards.push(cardInfo);
  }
  console.log('');
}

console.log(`\n✅ 找到完整配对: ${foundCards.length} 张`);
console.log(`❌ 未找到配对: ${notFoundCards.length} 张\n`);

if (notFoundCards.length > 0) {
  console.log('⚠️ 以下卡面未找到完整配对：');
  notFoundCards.forEach((card, index) => {
    console.log(`   ${index + 1}) 【${card.theme}】${card.char} (${card.rarity})`);
  });
  console.log('\n💡 提示: 请检查文件名是否正确，或手动添加缺失的图片\n');
}

if (foundCards.length === 0) {
  console.log('❌ 没有找到任何可压缩的卡面，退出');
  process.exit(0);
}

// ============================================
// 第二步: 压缩图片
// ============================================
async function compressAndAddCards() {
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 第二步: 压缩图片到Git库');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const compressedCards = [];

for (const card of foundCards) {
  console.log(`🖼️ 压缩: 【${card.theme}】${card.char}`);
  
  // baseFile和awakenedFile已经是完整路径，不需要再拼接
  const baseInputPath = card.baseFile;
  const awakenedInputPath = card.awakenedFile;
  
  const baseOutputName = `${card.theme} ${card.char}.webp`;
  const awakenedOutputName = `${card.theme} ${card.char}+.webp`;
  
  const baseOutputPath = path.join(outputDir, baseOutputName);
  const awakenedOutputPath = path.join(outputDir, awakenedOutputName);
  
  try {
    // 压缩基础图
    await sharp(baseInputPath)
      .webp({ quality: QUALITY })
      .toFile(baseOutputPath);
    
    const baseStats = fs.statSync(baseOutputPath);
    console.log(`   ✅ 基础图: ${baseOutputName} (${(baseStats.size / 1024).toFixed(2)} KB)`);
    
    // 压缩觉醒图
    await sharp(awakenedInputPath)
      .webp({ quality: QUALITY })
      .toFile(awakenedOutputPath);
    
    const awakenedStats = fs.statSync(awakenedOutputPath);
    console.log(`   ✅ 觉醒图: ${awakenedOutputName} (${(awakenedStats.size / 1024).toFixed(2)} KB)`);
    
    compressedCards.push({
      ...card,
      baseImage: baseOutputName,
      awakenedImage: awakenedOutputName,
    });
  } catch (error) {
    console.error(`   ❌ 压缩失败: ${error.message}`);
  }
  
  console.log('');
}

console.log(`✅ 成功压缩: ${compressedCards.length} 张卡面\n`);

if (compressedCards.length === 0) {
  console.log('❌ 没有成功压缩任何卡面，退出');
  process.exit(0);
}

// ============================================
// 第三步: 添加到角色表
// ============================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 第三步: 添加到角色表');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 读取现有数据
let cardsData = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
let cards = cardsData.cards;

console.log(`📦 当前数据: ${cards.length} 张卡面`);

// 备份
const backupPath = path.join(__dirname, '卡面库-最终版.backup-add-new-cards.json');
fs.copyFileSync(cardsJsonPath, backupPath);
console.log(`💾 已备份到: ${backupPath}\n`);

let addedCount = 0;

for (const cardInfo of compressedCards) {
  // 检查是否已存在
  const exists = cards.some(
    c => c.themeName === cardInfo.theme && c.characterName === cardInfo.char
  );
  
  if (exists) {
    console.log(`⚠️ 已存在: 【${cardInfo.theme}】${cardInfo.char}`);
    continue;
  }
  
  // 添加新卡面
  const newCard = {
    fullName: `【${cardInfo.theme}】${cardInfo.char}`,
    themeName: cardInfo.theme,
    characterName: cardInfo.char,
    baseImage: cardInfo.baseImage,
    awakenedImage: cardInfo.awakenedImage,
    rarity: cardInfo.rarity,
  };
  
  cards.push(newCard);
  console.log(`✅ 已添加: ${newCard.fullName} (${cardInfo.rarity})`);
  addedCount++;
}

// 保存
cardsData.cards = cards;
cardsData.totalCards = cards.length;
fs.writeFileSync(cardsJsonPath, JSON.stringify(cardsData, null, 2), 'utf8');

console.log(`\n✅ 更新完成！`);
console.log(`   压缩卡面: ${compressedCards.length} 张`);
console.log(`   添加卡面: ${addedCount} 张`);
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

// ============================================
// 第四步: 提示Git操作
// ============================================
console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔄 第四步: Git操作');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('✅ 图片已压缩到Git库目录');
console.log('📝 接下来请手动执行以下Git命令：\n');
console.log('   cd E:\\偶像大师\\闪耀色彩图片-最终版');
console.log('   git add 角色卡面');
console.log(`   git commit -m "补充${compressedCards.length}张新卡面"`);
console.log('   git push\n');

console.log('🎉 完成！');
console.log('\n💡 下一步: 运行 node E:\\偶像大师\\regenerate-card-data.js 重新生成代码');
}

// 运行主函数
compressAndAddCards().catch(error => {
  console.error('❌ 执行出错:', error);
  process.exit(1);
});

