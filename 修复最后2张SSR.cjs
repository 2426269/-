const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

console.log('=====================================');
console.log('  修复最后2张SSR卡面');
console.log('=====================================');

const gitImagesDir = path.join(__dirname, '闪耀色彩图片-最终版', '角色卡面');
const localImagesDir = 'E:\\BaiduNetdiskDownload\\闪耀色彩';
const cardsJsonPath = path.join(__dirname, '卡面库-最终版.json');

// 读取当前卡面数据
let cardsData = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
let cards = cardsData.cards;

console.log(`\n📦 当前数据: ${cards.length} 张卡面\n`);

// ============================================
// 第一步: 修复【雪空 セパレート】大崎甘奈
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 第一步: 修复【雪空 セパレート】大崎甘奈文件名');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const oldBaseName = '雪空セパレ ート 大崎甘奈.webp';
const newBaseName = '雪空 セパレート 大崎甘奈.webp';
const awakenedName = '雪空 セパレート 大崎甘奈+.webp';

const oldBasePath = path.join(gitImagesDir, oldBaseName);
const newBasePath = path.join(gitImagesDir, newBaseName);
const awakenedPath = path.join(gitImagesDir, awakenedName);

if (fs.existsSync(oldBasePath)) {
  fs.renameSync(oldBasePath, newBasePath);
  console.log(`✅ 已重命名基础图文件`);
  console.log(`   ${oldBaseName}`);
  console.log(`   → ${newBaseName}\n`);
  
  // 检查是否已在角色表中
  const exists = cards.some(c => c.themeName === '雪空 セパレート' && c.characterName === '大崎甘奈');
  
  if (!exists) {
    const newCard = {
      fullName: '【雪空 セパレート】大崎甘奈',
      themeName: '雪空 セパレート',
      characterName: '大崎甘奈',
      baseImage: newBaseName,
      awakenedImage: awakenedName,
      rarity: 'SSR',
    };
    cards.push(newCard);
    console.log(`✅ 已添加到角色表: 【雪空 セパレート】大崎甘奈\n`);
  } else {
    console.log(`⚠️ 已存在于角色表中\n`);
  }
} else {
  console.log(`⚠️ 未找到文件: ${oldBaseName}\n`);
}

// ============================================
// 第二步: 压缩【new or ...】斑鳩ルカ
// ============================================
async function compressNewOrCard() {
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 第二步: 压缩【new or ...】斑鳩ルカ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 递归搜索
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
    // 忽略错误
  }
  return results;
}

console.log('🔍 搜索【new or ...】斑鳩ルカ...\n');
const allFiles = searchFiles(localImagesDir);
const matchingFiles = allFiles.filter(f => {
  const fileName = path.basename(f);
  return fileName.includes('new or ...') && fileName.includes('斑鳩ルカ');
});

if (matchingFiles.length > 0) {
  console.log(`✅ 找到 ${matchingFiles.length} 个文件:`);
  matchingFiles.forEach(f => console.log(`   ${path.relative(localImagesDir, f)}`));
  
  const baseFile = matchingFiles.find(f => !f.includes('+'));
  const awakenedFile = matchingFiles.find(f => f.includes('+'));
  
  if (baseFile && awakenedFile) {
    console.log(`\n🖼️ 开始压缩...\n`);
    
    const baseOutputName = 'new or ... 斑鳩ルカ.webp';
    const awakenedOutputName = 'new or ... 斑鳩ルカ+.webp';
    
    const baseOutputPath = path.join(gitImagesDir, baseOutputName);
    const awakenedOutputPath = path.join(gitImagesDir, awakenedOutputName);
    
    try {
      // 压缩基础图
      await sharp(baseFile)
        .webp({ quality: 85 })
        .toFile(baseOutputPath);
      
      const baseStats = fs.statSync(baseOutputPath);
      console.log(`✅ 基础图: ${baseOutputName} (${(baseStats.size / 1024).toFixed(2)} KB)`);
      
      // 压缩觉醒图
      await sharp(awakenedFile)
        .webp({ quality: 85 })
        .toFile(awakenedOutputPath);
      
      const awakenedStats = fs.statSync(awakenedOutputPath);
      console.log(`✅ 觉醒图: ${awakenedOutputName} (${(awakenedStats.size / 1024).toFixed(2)} KB)\n`);
      
      // 添加到角色表
      const exists = cards.some(c => c.themeName === 'new or ...' && c.characterName === '斑鳩ルカ');
      
      if (!exists) {
        const newCard = {
          fullName: '【new or ...】斑鳩ルカ',
          themeName: 'new or ...',
          characterName: '斑鳩ルカ',
          baseImage: baseOutputName,
          awakenedImage: awakenedOutputName,
          rarity: 'SSR',
        };
        cards.push(newCard);
        console.log(`✅ 已添加到角色表: 【new or ...】斑鳩ルカ\n`);
        return 1;
      } else {
        console.log(`⚠️ 已存在于角色表中\n`);
        return 0;
      }
    } catch (error) {
      console.error(`❌ 压缩失败: ${error.message}\n`);
      return 0;
    }
  } else {
    console.log(`\n⚠️ 配对不完整`);
    if (baseFile) console.log(`   基础图: ${path.relative(localImagesDir, baseFile)}`);
    if (awakenedFile) console.log(`   觉醒图: ${path.relative(localImagesDir, awakenedFile)}`);
    return 0;
  }
} else {
  console.log(`❌ 未找到\n`);
  return 0;
}
}

// 运行
compressNewOrCard().then(addedCount => {
  // ============================================
  // 保存
  // ============================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💾 保存更新');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const backupPath = path.join(__dirname, '卡面库-最终版.backup-fix-last-2.json');
  fs.copyFileSync(cardsJsonPath, backupPath);
  console.log(`💾 已备份到: ${backupPath}`);
  
  cardsData.cards = cards;
  cardsData.totalCards = cards.length;
  fs.writeFileSync(cardsJsonPath, JSON.stringify(cardsData, null, 2), 'utf8');
  
  console.log(`\n✅ 更新完成！`);
  console.log(`   当前总卡面数: ${cards.length} 张`);
  
  // 品阶统计
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 最新品阶统计');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const stats = { UR: 0, SSR: 0, SR: 0 };
  cards.forEach(c => stats[c.rarity]++);
  
  console.log(`   UR:  ${stats.UR} 张 (${((stats.UR / cards.length) * 100).toFixed(2)}%)`);
  console.log(`   SSR: ${stats.SSR} 张 (${((stats.SSR / cards.length) * 100).toFixed(2)}%)`);
  console.log(`   SR:  ${stats.SR} 张 (${((stats.SR / cards.length) * 100).toFixed(2)}%)`);
  console.log(`   总计: ${cards.length} 张`);
  
  console.log('\n\n🎉 完成！所有5张SSR已补充完毕！');
  console.log('\n💡 下一步:');
  console.log('   1. node E:\\偶像大师\\regenerate-card-data.js');
  console.log('   2. node E:\\偶像大师\\correct-rarity-and-verify.js');
}).catch(error => {
  console.error('❌ 执行出错:', error);
  process.exit(1);
});

















