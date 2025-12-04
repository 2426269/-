# Bug 修复 - 培育计划判断错误

## 📅 修复日期
2025-11-03

---

## 🐛 Bug 描述

### 问题现象
用户反馈：黛冬優子【誘爆ハートビート】明明是**非凡属性**，但AI生成技能卡时使用的是**感性**培育计划。

### 实际数据（来自 `card-attributes.json`）
```json
"【誘爆ハートビート】黛冬優子": {
  "attributeType": "非凡",        // ← 属性类型（培育计划）
  "stamina": 26,
  "recommendedStyle": "全力",     // ← 推荐流派（打法风格）
  "stats": {
    "vocal": 85,
    "dance": 90,
    "visual": 70
  }
}
```

### 错误原因
代码错误地使用了 `card.attribute.style`（推荐流派 = "全力"）来判断培育计划，而不是 `card.attribute.type`（属性类型 = "非凡"）。

```typescript
// ❌ 错误的代码（修复前）
const style = card.attribute.style;  // "全力"
if (style.includes('理性') || style.includes('逻辑')) {
  producePlan = '理性';
} else if (style.includes('非凡') || style.includes('异常')) {
  producePlan = '非凡';
}
// "全力" 不包含任何关键词，使用默认值 → producePlan = '感性'
```

---

## 📊 数据存储位置

### 414张角色卡属性数据
存储在：`src/偶像大师闪耀色彩-重构/卡牌管理/card-attributes.json`

### 数据结构
```json
{
  "【卡牌全名】角色名": {
    "attributeType": "理性" | "感性" | "非凡",  // 属性类型（培育计划）
    "stamina": 20~35,                          // 体力
    "recommendedStyle": "全力" | "好调" | "集中" | "干劲" | "好印象",  // 推荐流派
    "stats": {
      "vocal": 60~90,                          // 声乐
      "dance": 60~90,                          // 舞蹈
      "visual": 60~90                          // 视觉
    }
  }
}
```

### 统计信息
```typescript
export const ATTRIBUTE_STATS = {
  "total": 414,
  "byAttribute": {
    "理性": 136,
    "感性": 139,
    "非凡": 139
  },
  "byRarity": {
    "UR": 3,
    "SSR": 283,
    "SR": 85,
    "R": 43
  }
};
```

---

## ✅ 修复方案

### 1. **修正培育计划判断逻辑**

**修复前**（`偶像图鉴.vue` 第877-889行）：
```typescript
// 确定培育计划
let producePlan: ProducePlan = '感性'; // 默认
if (card.attribute) {
  // 根据推荐流派推断培育计划 ❌ 错误！
  const style = card.attribute.style;
  if (style.includes('理性') || style.includes('逻辑')) {
    producePlan = '理性';
  } else if (style.includes('非凡') || style.includes('异常')) {
    producePlan = '非凡';
  } else if (style.includes('感性') || style.includes('センス')) {
    producePlan = '感性';
  }
}
```

**修复后**：
```typescript
// 确定培育计划（使用 attribute.type 而不是 attribute.style）
let producePlan: ProducePlan = '感性'; // 默认
if (card.attribute) {
  // 根据属性类型确定培育计划 ✅ 正确！
  const attributeType = card.attribute.type;
  if (attributeType === '理性') {
    producePlan = '理性';
  } else if (attributeType === '非凡') {
    producePlan = '非凡';
  } else if (attributeType === '感性') {
    producePlan = '感性';
  }
}
```

---

### 2. **保留推荐流派传递**

**代码位置**（`偶像图鉴.vue` 第896-904行）：
```typescript
// 调用 AI 生成助手
const result = await generateSkillCard({
  characterName: card.characterName,
  rarity: card.rarity as SkillCardRarity,
  producePlan,                         // ← 从 attribute.type 获取
  recommendedStyle: card.attribute?.style,  // ← 从 attribute.style 获取
  theme: card.theme,
  streaming: true,
});
```

---

## 📈 数据流说明

### 完整数据流

```
1️⃣ card-attributes.json
   ↓
   "【誘爆ハートビート】黛冬優子": {
     "attributeType": "非凡",     // 属性类型
     "recommendedStyle": "全力"   // 推荐流派
   }

2️⃣ 卡牌管理/卡牌属性.ts
   ↓
   getCardAttribute(fullCardName)
   返回 CardAttribute 对象

3️⃣ 偶像图鉴.vue
   ↓
   card.attribute = {
     type: "非凡",        // ← attributeType
     style: "全力",       // ← recommendedStyle
     stamina: 26,
     stats: { ... }
   }

4️⃣ 生成技能卡
   ↓
   producePlan = card.attribute.type  // "非凡"
   recommendedStyle = card.attribute.style  // "全力"

5️⃣ AI生成助手
   ↓
   提示词变量替换：
   - {{producePlan}} → "非凡"
   - {{recommendedStyle}} → "全力"

6️⃣ AI生成
   ↓
   根据"非凡"培育计划和"全力"打法生成技能卡
```

---

## 📝 属性类型 vs 推荐流派

### 属性类型（attributeType）
**作用**：确定培育计划

| 属性类型 | 培育计划 | 数量 | 特色       |
| -------- | -------- | ---- | ---------- |
| 理性     | 理性     | 136  | 逻辑、策略 |
| 感性     | 感性     | 139  | 直觉、情感 |
| 非凡     | 非凡     | 139  | 突破、创新 |

---

### 推荐流派（recommendedStyle）
**作用**：影响技能卡的打法风格

| 推荐流派 | 打法特点     | 示例                       |
| -------- | ------------ | -------------------------- |
| 全力     | 高风险高回报 | 消耗更多资源，获得更高数值 |
| 好调     | 稳定增益     | 持续获得好调状态           |
| 集中     | 聚焦单一属性 | 集中提升某个属性           |
| 干劲     | 持久战       | 提升干劲，延长战斗         |
| 好印象   | 辅助型       | 提升好印象，触发额外效果   |

---

## 🎯 AI 提示词中的使用

### 提示词模板（`提示词区.ts`）

```markdown
### 当前角色信息
- **角色名称**: {{characterName}}
- **卡牌稀有度**: {{rarity}}
- **培育计划**: {{producePlan}}          ← 从 attributeType 获取
- **推荐打法**: {{recommendedStyle}}     ← 从 recommendedStyle 获取
- **卡牌主题**: {{theme}}
```

### 实际示例（黛冬優子）

**修复前**（❌ 错误）：
```
- **角色名称**: 黛冬優子
- **卡牌稀有度**: UR
- **培育计划**: 感性          ← 错误！应该是"非凡"
- **推荐打法**: 全力           ← 正确
- **卡牌主题**: 誘爆ハートビート
```

**修复后**（✅ 正确）：
```
- **角色名称**: 黛冬優子
- **卡牌稀有度**: UR
- **培育计划**: 非凡          ← 正确！
- **推荐打法**: 全力           ← 正确
- **卡牌主题**: 誘爆ハートビート
```

---

## 🧪 测试案例

### 测试 1：非凡属性 + 全力打法
```json
"【誘爆ハートビート】黛冬優子": {
  "attributeType": "非凡",
  "recommendedStyle": "全力"
}
```
- 预期 `producePlan`：**非凡** ✅
- 预期 `recommendedStyle`：**全力** ✅

---

### 测试 2：理性属性 + 好印象打法
```json
"【モラトリアム・レポート】田中摩美々": {
  "attributeType": "理性",
  "recommendedStyle": "好印象"
}
```
- 预期 `producePlan`：**理性** ✅
- 预期 `recommendedStyle`：**好印象** ✅

---

### 测试 3：感性属性 + 集中打法
```json
"【longing】大崎甘奈": {
  "attributeType": "感性",
  "recommendedStyle": "集中"
}
```
- 预期 `producePlan`：**感性** ✅
- 预期 `recommendedStyle`：**集中** ✅

---

## ✅ 修复验证

### 构建状态
- ✅ 编译成功，无错误
- ✅ TypeScript 类型检查通过

### 逻辑验证
- ✅ 培育计划正确从 `attributeType` 获取
- ✅ 推荐流派正确从 `recommendedStyle` 获取
- ✅ 两个参数都正确传递给 AI 生成助手

---

## 🎉 总结

### 修复的问题
1. ✅ **培育计划判断错误** - 从错误的字段（style）改为正确的字段（type）
2. ✅ **数据流清晰** - 明确了属性类型和推荐流派的区别和作用

### 影响范围
- **影响文件**：`src/偶像大师闪耀色彩-重构/图鉴/界面/偶像图鉴.vue`
- **影响行数**：第877-889行（共13行）
- **影响功能**：AI技能卡生成

### 下一步测试
现在可以重新测试黛冬優子【誘爆ハートビート】的技能卡生成，应该：
- ✅ 培育计划显示为"非凡"
- ✅ 推荐打法显示为"全力"
- ✅ AI根据"非凡"计划生成相应特色的技能


