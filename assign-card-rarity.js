const fs = require('fs');
const path = require('path');

console.log("=====================================");
console.log("  分配卡面品阶 (UR/SSR/SR)");
console.log("=====================================");

// 读取SSR和SR列表文件
const ssrListPath = 'C:\\Users\\33987\\Desktop\\新建 文本文档 (2).txt';
const srListPath = 'C:\\Users\\33987\\Desktop\\新建 文本文档 (3).txt';
const cardsJsonPath = path.join(__dirname, '卡面库-最终版.json');
const outputJsonPath = path.join(__dirname, '卡面库-最终版.json');

console.log("\n📖 读取文件...");

// 1. 解析SSR列表
let ssrCardNames = new Set();
try {
    const ssrListContent = fs.readFileSync(ssrListPath, 'utf8');
    
    // 解析wiki格式，提取【xxx】格式的卡名
    const lines = ssrListContent.split('\n');
    for (const line of lines) {
        // 匹配 【xxx】 格式
        const match = line.match(/【(.+?)】/);
        if (match) {
            ssrCardNames.add(match[1]);
        }
    }
    
    console.log(`✅ 找到 ${ssrCardNames.size} 个SSR卡名`);
    
} catch (error) {
    console.error(`❌ 读取SSR列表失败: ${error.message}`);
    process.exit(1);
}

// 2. 解析SR列表
let srCardNames = new Set();
try {
    const srListContent = fs.readFileSync(srListPath, 'utf8');
    
    // 解析wiki格式，提取【xxx】格式的卡名
    const lines = srListContent.split('\n');
    for (const line of lines) {
        // 匹配 【xxx】 格式
        const match = line.match(/【(.+?)】/);
        if (match) {
            srCardNames.add(match[1]);
        }
    }
    
    console.log(`✅ 找到 ${srCardNames.size} 个SR卡名`);
    
} catch (error) {
    console.error(`❌ 读取SR列表失败: ${error.message}`);
    process.exit(1);
}

// 3. 定义UR卡
const urCards = new Set([
    '絵空靴',        // 杜野凛世
    '誘爆ハートビート', // 黛冬優子
    'アマテラス'      // 樋口円香
]);

console.log("\n🌟 品阶统计:");
console.log(`   UR:  3 个指定卡`);
console.log(`   SSR: ${ssrCardNames.size} 个卡名`);
console.log(`   SR:  ${srCardNames.size} 个卡名`);

// 4. 读取并更新卡面数据
let cardsData;
let cards;
try {
    cardsData = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
    cards = cardsData.cards || cardsData; // 支持两种格式
    console.log(`\n📦 读取到 ${cards.length} 张卡面`);
} catch (error) {
    console.error(`❌ 读取卡面库失败: ${error.message}`);
    process.exit(1);
}

// 5. 分配品阶
let urCount = 0;
let ssrCount = 0;
let srCount = 0;
let unknownCount = 0;

console.log("\n⚙️ 开始分配品阶...");

const unknownCards = [];

for (const card of cards) {
    const themeName = card.themeName;
    
    if (urCards.has(themeName)) {
        card.rarity = 'UR';
        urCount++;
    } else if (ssrCardNames.has(themeName)) {
        card.rarity = 'SSR';
        ssrCount++;
    } else if (srCardNames.has(themeName)) {
        card.rarity = 'SR';
        srCount++;
    } else {
        // 未找到匹配的品阶，默认设为SR
        card.rarity = 'SR';
        unknownCount++;
        unknownCards.push(`${card.fullName} (主题: ${themeName})`);
    }
}

console.log("\n✅ 品阶分配完成！");
console.log(`\n📊 统计结果:`);
console.log(`   UR:  ${urCount} 张 (${(urCount / cards.length * 100).toFixed(2)}%)`);
console.log(`   SSR: ${ssrCount} 张 (${(ssrCount / cards.length * 100).toFixed(2)}%)`);
console.log(`   SR:  ${srCount} 张 (${(srCount / cards.length * 100).toFixed(2)}%)`);
console.log(`   总计: ${cards.length} 张`);

if (unknownCount > 0) {
    console.log(`\n⚠️ 警告: 有 ${unknownCount} 张卡面未在SSR或SR列表中找到，已默认设为SR:`);
    unknownCards.forEach(card => console.log(`   - ${card}`));
}

// 5. 备份并保存
const backupPath = path.join(__dirname, '卡面库-最终版.backup-before-rarity.json');
fs.copyFileSync(cardsJsonPath, backupPath);
console.log(`\n💾 已备份到: ${backupPath}`);

// 保持原始数据结构
if (cardsData.cards) {
    cardsData.cards = cards;
    cardsData.totalCards = cards.length;
    fs.writeFileSync(outputJsonPath, JSON.stringify(cardsData, null, 2), 'utf8');
} else {
    fs.writeFileSync(outputJsonPath, JSON.stringify(cards, null, 2), 'utf8');
}
console.log(`💾 已保存到: ${outputJsonPath}`);

// 6. 显示每个角色的卡面品阶分布
console.log("\n📋 各角色卡面品阶分布:");
const characterStats = {};

for (const card of cards) {
    const char = card.characterName;
    if (!characterStats[char]) {
        characterStats[char] = { UR: 0, SSR: 0, SR: 0, total: 0 };
    }
    characterStats[char][card.rarity]++;
    characterStats[char].total++;
}

// 按总卡面数排序
const sortedChars = Object.entries(characterStats)
    .sort((a, b) => b[1].total - a[1].total);

sortedChars.forEach(([char, stats]) => {
    const urStr = stats.UR > 0 ? `UR:${stats.UR}` : '';
    const ssrStr = stats.SSR > 0 ? `SSR:${stats.SSR}` : '';
    const srStr = stats.SR > 0 ? `SR:${stats.SR}` : '';
    const parts = [urStr, ssrStr, srStr].filter(s => s);
    console.log(`   ${char}: ${stats.total}张 (${parts.join(', ')})`);
});

console.log("\n🎉 完成！");

