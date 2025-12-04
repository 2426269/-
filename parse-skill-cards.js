const fs = require('fs');

// 读取CSV文件
const content = fs.readFileSync('C:\\Users\\33987\\Desktop\\学园偶像大师技能卡.csv', 'utf-8');
const lines = content.split('\n');

// 按属性和品阶分类
const database = {
  非凡: { SSR: [], SR: [], R: [], N: [] },
  理性: { SSR: [], SR: [], R: [], N: [] },
  感性: { SSR: [], SR: [], R: [], N: [] },
  自由: { SSR: [], SR: [], R: [], N: [], 陷阱卡: [] },
};

// 解析每一行
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // CSV解析：处理逗号分隔，但要注意可能有双引号包裹的字段
  const fields = [];
  let currentField = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField);

  if (fields.length >= 6) {
    const [id, attr, name, rarity, effect1, effect2, cost] = fields;

    if (database[attr] && database[attr][rarity]) {
      database[attr][rarity].push({
        id: id,
        name: name,
        rarity: rarity,
        effect_before: effect1,
        effect_after: effect2,
        cost: cost || '0',
      });
    }
  }
}

// 统计信息
const stats = {};
for (const attr in database) {
  stats[attr] = {};
  for (const rarity in database[attr]) {
    stats[attr][rarity] = database[attr][rarity].length;
  }
}

console.log('数据库统计：');
console.log(JSON.stringify(stats, null, 2));

// 保存JSON数据库
fs.writeFileSync('E:\\偶像大师\\学园偶像大师技能卡数据库.json', JSON.stringify(database, null, 2), 'utf-8');
console.log('\n✅ 数据库已创建：E:\\偶像大师\\学园偶像大师技能卡数据库.json');

// 为AI生成示例数据（每个稀有度抽取3个示例）
const examples = {};
for (const attr in database) {
  examples[attr] = {};
  for (const rarity in database[attr]) {
    examples[attr][rarity] = database[attr][rarity].slice(0, 3);
  }
}

fs.writeFileSync('E:\\偶像大师\\技能卡AI生成示例.json', JSON.stringify(examples, null, 2), 'utf-8');
console.log('✅ AI示例已创建：E:\\偶像大师\\技能卡AI生成示例.json');


