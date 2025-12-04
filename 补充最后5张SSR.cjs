const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

console.log('=====================================');
console.log('  补充最后5张SSR卡面');
console.log('=====================================');

const localImagesDir = 'E:\\BaiduNetdiskDownload\\闪耀色彩';
const gitImagesDir = path.join(__dirname, '闪耀色彩图片-最终版', '角色卡面');
const cardsJsonPath = path.join(__dirname, '卡面库-最终版.json');

// 读取当前卡面数据
let cardsData = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
let cards = cardsData.cards;

console.log(`\n📦 当前数据: ${cards.length} 张卡面`);

// 备份
const backupPath = path.join(__dirname, '卡面库-最终版.backup-final-5-ssr.json');
fs.copyFileSync(cardsJsonPath, backupPath);
console.log(`💾 已备份到: ${backupPath}\n`);

// ============================================
// 第一步: 检查Git库中已有的卡面
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 第一步: 检查Git库中已有的卡面');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const gitExistingCards = [
  { theme: '雪空 セパレート', char: '大崎甘奈', rarity: 'SSR' },
  { theme: 'multi-angle', char: '黛冬優子', rarity: 'SSR' },
];

let addedFromGit = 0;

for (const cardInfo of gitExistingCards) {
  console.log(`【${cardInfo.theme}】${cardInfo.char} (${cardInfo.rarity})`);
  
  // 搜索Git库中可能的文件名
  const allGitFiles = fs.readdirSync(gitImagesDir);
  const matchingFiles = allGitFiles.filter(f => 
    f.includes(cardInfo.theme) && f.includes(cardInfo.char)
  );
  
  if (matchingFiles.length > 0) {
    console.log(`   ✅ 在Git库中找到 ${matchingFiles.length} 个文件:`);
    matchingFiles.forEach(f => console.log(`      ${f}`));
    
    const baseFile = matchingFiles.find(f => !f.includes('+'));
    const awakenedFile = matchingFiles.find(f => f.includes('+'));
    
    if (baseFile && awakenedFile) {
      // 检查是否已在角色表中
      const exists = cards.some(c => 
        c.themeName === cardInfo.theme && c.characterName === cardInfo.char
      );
      
      if (exists) {
        console.log(`   ⚠️ 已存在于角色表中`);
      } else {
        const newCard = {
          fullName: `【${cardInfo.theme}】${cardInfo.char}`,
          themeName: cardInfo.theme,
          characterName: cardInfo.char,
          baseImage: baseFile,
          awakenedImage: awakenedFile,
          rarity: cardInfo.rarity,
        };
        cards.push(newCard);
        console.log(`   ✅ 已添加到角色表`);
        addedFromGit++;
      }
    } else {
      console.log(`   ⚠️ 配对不完整 (基础图: ${baseFile ? '有' : '无'}, 觉醒图: ${awakenedFile ? '有' : '无'})`);
    }
  } else {
    console.log(`   ❌ 在Git库中未找到`);
  }
  console.log('');
}

// ============================================
// 第二步: 搜索并压缩本地卡面
// ============================================
async function searchAndCompress() {
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 第二步: 搜索并压缩本地卡面');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const localCards = [
  { theme: '秋空ばくちずさんで', char: '月岡恋鐘', rarity: 'SSR' },
  { theme: 'Anti-Gravity', char: '芹沢あさひ', rarity: 'SSR' },
  { theme: 'new or …', char: '斑鳩ルカ', rarity: 'SSR' },
];

// 递归搜索本地文件
function searchFiles(dir) {
  const results = [];
  try {
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
  } catch (error) {
    // 忽略权限错误等
  }
  return results;
}

console.log('🔍 正在递归搜索本地图片...\n');
const allLocalFiles = searchFiles(localImagesDir);
console.log(`📊 本地共 ${allLocalFiles.length} 个图片文件\n`);

const foundCards = [];

for (const cardInfo of localCards) {
  console.log(`🔍 搜索: 【${cardInfo.theme}】${cardInfo.char} (${cardInfo.rarity})`);
  
  const matchingFiles = allLocalFiles.filter(f => {
    const fileName = path.basename(f);
    return fileName.includes(cardInfo.theme) && fileName.includes(cardInfo.char);
  });
  
  if (matchingFiles.length > 0) {
    const baseFile = matchingFiles.find(f => !f.includes('+'));
    const awakenedFile = matchingFiles.find(f => f.includes('+'));
    
    if (baseFile && awakenedFile) {
      console.log(`   ✅ 找到配对`);
      console.log(`      基础图: ${path.relative(localImagesDir, baseFile)}`);
      console.log(`      觉醒图: ${path.relative(localImagesDir, awakenedFile)}`);
      foundCards.push({
        ...cardInfo,
        baseFile,
        awakenedFile,
      });
    } else {
      console.log(`   ⚠️ 配对不完整`);
      if (baseFile) console.log(`      基础图: ${path.relative(localImagesDir, baseFile)}`);
      if (awakenedFile) console.log(`      觉醒图: ${path.relative(localImagesDir, awakenedFile)}`);
    }
  } else {
    console.log(`   ❌ 未找到`);
  }
  console.log('');
}

if (foundCards.length === 0) {
  console.log('⚠️ 没有找到需要压缩的本地卡面\n');
  return 0;
}

// 压缩图片
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 第三步: 压缩图片');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!fs.existsSync(gitImagesDir)) {
  fs.mkdirSync(gitImagesDir, { recursive: true });
}

let compressedCount = 0;

for (const card of foundCards) {
  console.log(`🖼️ 压缩: 【${card.theme}】${card.char}`);
  
  const baseOutputName = `${card.theme} ${card.char}.webp`;
  const awakenedOutputName = `${card.theme} ${card.char}+.webp`;
  
  const baseOutputPath = path.join(gitImagesDir, baseOutputName);
  const awakenedOutputPath = path.join(gitImagesDir, awakenedOutputName);
  
  try {
    // 压缩基础图
    await sharp(card.baseFile)
      .webp({ quality: 85 })
      .toFile(baseOutputPath);
    
    const baseStats = fs.statSync(baseOutputPath);
    console.log(`   ✅ 基础图: ${baseOutputName} (${(baseStats.size / 1024).toFixed(2)} KB)`);
    
    // 压缩觉醒图
    await sharp(card.awakenedFile)
      .webp({ quality: 85 })
      .toFile(awakenedOutputPath);
    
    const awakenedStats = fs.statSync(awakenedOutputPath);
    console.log(`   ✅ 觉醒图: ${awakenedOutputName} (${(awakenedStats.size / 1024).toFixed(2)} KB)`);
    
    // 添加到角色表
    const newCard = {
      fullName: `【${card.theme}】${card.char}`,
      themeName: card.theme,
      characterName: card.char,
      baseImage: baseOutputName,
      awakenedImage: awakenedOutputName,
      rarity: card.rarity,
    };
    cards.push(newCard);
    console.log(`   ✅ 已添加到角色表`);
    compressedCount++;
  } catch (error) {
    console.error(`   ❌ 压缩失败: ${error.message}`);
  }
  console.log('');
}

return compressedCount;
}

// 运行异步函数
searchAndCompress().then(compressedCount => {
  // ============================================
  // 第四步: 保存更新
  // ============================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💾 第四步: 保存更新');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  cardsData.cards = cards;
  cardsData.totalCards = cards.length;
  fs.writeFileSync(cardsJsonPath, JSON.stringify(cardsData, null, 2), 'utf8');
  
  console.log(`✅ 更新完成！`);
  console.log(`   从Git库添加: ${addedFromGit} 张`);
  console.log(`   压缩并添加: ${compressedCount} 张`);
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
  
  console.log('\n\n🎉 完成！');
  console.log('\n💡 下一步:');
  console.log('   1. 运行: node E:\\偶像大师\\regenerate-card-data.js');
  console.log('   2. 验证: node E:\\偶像大师\\correct-rarity-and-verify.js');
  console.log('   3. 推送到Git: cd E:\\偶像大师\\闪耀色彩图片-最终版 && git add . && git commit -m "补充最后5张SSR" && git push');
}).catch(error => {
  console.error('❌ 执行出错:', error);
  process.exit(1);
});

















