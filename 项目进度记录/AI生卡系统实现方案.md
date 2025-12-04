# AI生成技能卡系统 - 完整实现方案

**日期**: 2025-11-03  
**版本**: v1.0.0  
**架构**: 深度集成SillyTavern生态

---

## 🎯 系统目标

为每张P卡生成专属技能卡，通过以下流程：
1. 点击"生成技能卡"按钮
2. 自动调用AI生卡思维链
3. 根据角色信息从数据库抽取示例
4. 组装完整提示词
5. 通过通信系统上传至SillyTavern
6. 接收LLM返回的技能卡数据
7. 解析并存入IndexedDB

---

## 📁 文件结构

```
src/偶像大师闪耀色彩-重构/
├── AI生成/
│   ├── 类型/
│   │   └── 生成请求类型.ts
│   ├── 服务/
│   │   ├── 世界书管理器.ts       # 管理世界书条目
│   │   ├── 提示词构建器.ts       # 构建完整提示词
│   │   ├── 示例卡选择器.ts       # 从数据库选择示例
│   │   └── 技能卡生成器.ts       # 主流程控制
│   └── 界面/
│       └── 生成技能卡按钮.vue   # UI组件
└── 世界书/
    ├── 偶像大师闪耀色彩.json     # 主世界书文件
    ├── 思维链/
    │   ├── 生卡CoT.txt           # 技能卡生成思维链
    │   ├── 剧情CoT.txt           # 剧情生成思维链
    │   └── 结局CoT.txt           # 结局生成思维链
    ├── 技能卡调用区/
    │   ├── R卡示例.json
    │   ├── SR卡示例.json
    │   └── SSR卡示例.json
    └── 提示词框架/
        └── 生卡框架.txt          # 提示词模板
```

---

## 🏗️ 架构设计

### 核心模块

```
用户点击 → 生成技能卡按钮.vue
            ↓
        技能卡生成器.ts (主控)
            ├→ 世界书管理器.ts (启用CoT)
            ├→ 示例卡选择器.ts (抽取示例)
            ├→ 提示词构建器.ts (组装提示词)
            └→ 通信系统 (发送给LLM)
                    ↓
                LLM返回JSON
                    ↓
        解析 → 验证 → 存入IndexedDB
```

---

## 📋 详细实现

### 1. 世界书结构设计

#### 1.1 主世界书文件

`世界书/偶像大师闪耀色彩.json`:

```json
{
  "name": "偶像大师闪耀色彩",
  "description": "游戏核心数据、人设、思维链、生卡框架",
  "entries": [
    // ===== 思维链区 =====
    {
      "uid": "cot_skill_card_generation",
      "key": [],
      "content": "{{include:./思维链/生卡CoT.txt}}",
      "order": 100,
      "enabled": false,
      "constant": false,
      "comment": "技能卡生成专用思维链，调用时启用"
    },
    
    // ===== 技能卡调用区（感性系统） =====
    {
      "uid": "example_sense_r",
      "key": [],
      "content": "{{include:./技能卡调用区/感性_R卡.json}}",
      "order": 90,
      "enabled": false,
      "constant": false
    },
    {
      "uid": "example_sense_sr",
      "key": [],
      "content": "{{include:./技能卡调用区/感性_SR卡.json}}",
      "order": 90,
      "enabled": false,
      "constant": false
    },
    {
      "uid": "example_sense_ssr",
      "key": [],
      "content": "{{include:./技能卡调用区/感性_SSR卡.json}}",
      "order": 90,
      "enabled": false,
      "constant": false
    },
    
    // ===== 技能卡调用区（理性系统） =====
    {
      "uid": "example_logic_r",
      "key": [],
      "content": "{{include:./技能卡调用区/理性_R卡.json}}",
      "order": 90,
      "enabled": false,
      "constant": false
    },
    {
      "uid": "example_logic_sr",
      "key": [],
      "content": "{{include:./技能卡调用区/理性_SR卡.json}}",
      "order": 90,
      "enabled": false,
      "constant": false
    },
    {
      "uid": "example_logic_ssr",
      "key": [],
      "content": "{{include:./技能卡调用区/理性_SSR卡.json}}",
      "order": 90,
      "enabled": false,
      "constant": false
    },
    
    // ===== 技能卡调用区（非凡系统） =====
    {
      "uid": "example_anomaly_r",
      "key": [],
      "content": "{{include:./技能卡调用区/非凡_R卡.json}}",
      "order": 90,
      "enabled": false,
      "constant": false
    },
    {
      "uid": "example_anomaly_sr",
      "key": [],
      "content": "{{include:./技能卡调用区/非凡_SR卡.json}}",
      "order": 90,
      "enabled": false,
      "constant": false
    },
    {
      "uid": "example_anomaly_ssr",
      "key": [],
      "content": "{{include:./技能卡调用区/非凡_SSR卡.json}}",
      "order": 90,
      "enabled": false,
      "constant": false
    },
    
    // ===== 提示词框架区 =====
    {
      "uid": "prompt_framework_skill_card",
      "key": [],
      "content": "{{include:./提示词框架/生卡框架.txt}}",
      "order": 95,
      "enabled": false,
      "constant": false,
      "comment": "技能卡生成的提示词模板"
    },
    
    // ===== 角色人设（常驻） =====
    {
      "uid": "mano_persona",
      "key": ["樱木真乃", "mano"],
      "content": "[角色：樱木真乃]\n性格：温柔、努力、内向但勇敢...\n特点：善于感受他人情绪、会被鸟类喜欢...\n口头禅：「我会加油的！」",
      "order": 100,
      "enabled": true,
      "constant": true
    }
    // ... 其他28个偶像的人设
  ]
}
```

#### 1.2 思维链文件

`世界书/思维链/生卡CoT.txt`:

```
[技能卡生成 - 思维链（Chain of Thought）]

你正在为《偶像大师闪耀色彩》生成专属技能卡。请按以下步骤思考：

## 第一步：分析角色与卡面主题
1. 角色是谁？她的性格特点是什么？
2. 这张卡的稀有度是什么？（R/SR/SSR/UR）
3. 卡面主题是什么？（如"舞台上的闪耀""温柔的笑容""努力的汗水"等）
4. 培育计划是什么？（感性/理性/非凡）

## 第二步：确定效果强度范围
根据稀有度决定效果强度：
- **R卡（Cost 1-2）**：极简单、单一效果
  - 示例：元气+10、好印象+6、集中+2
- **SR卡（Cost 2-3）**：2-3个效果组合，或带条件的强力效果
  - 示例：元气+10 + 好调2回合 + 技能卡使用数+1
- **SSR卡（Cost 3-5）**：多个强力效果组合，或消耗Buff触发超强效果
  - 示例：消耗好调1回合 + 下一张卡效果翻倍 + 技能卡使用数+1
- **UR卡（Cost 4-6）**：改变规则的机制，或SSR效果的2倍强度
  - 示例：回合数+2、复制手牌中所有卡、全属性Buff同时触发

## 第三步：参考示例卡牌
仔细阅读下方提供的示例卡牌（与当前卡牌同稀有度、同培育计划）：
- 观察它们的效果模式（属性+Buff+特殊效果的组合）
- 观察它们的Cost和效果强度的平衡
- 学习它们的效果描述方式

## 第四步：设计技能名称
根据角色特点和卡面主题，设计一个贴合的技能名称：
- 感性系：偏向情感类（如"温柔的鼓励""闪耀的笑容"）
- 理性系：偏向逻辑类（如"冷静分析""完美计划"）
- 非凡系：偏向力量类（如"全力冲刺""坚决的意志"）

## 第五步：平衡Cost和Effect
确保Cost（消耗）和Effect（效果）的平衡：
- Cost越高，效果应该越强
- 如果有强力效果（如"下一张卡效果翻倍"），Cost应该适当增加
- 如果有负面条件（如"消耗体力5"），可以降低Cost或增强效果

## 第六步：输出JSON格式
严格按照以下JSON格式输出（不要有任何额外的文字说明）：

```json
{
  "name": "技能卡名称（日文）",
  "nameCN": "技能卡名称（中文）",
  "rarity": "R/SR/SSR/UR",
  "plan": "感性/理性/非凡",
  "cardType": "A/M",
  "cost": "消耗值（如 -3 表示消耗3元气）",
  "effect_before": "强化前效果（日文，参考示例格式）",
  "effect_after": "强化后效果（日文，参考示例格式）",
  "effect_before_cn": "强化前效果（中文）",
  "effect_after_cn": "强化后效果（中文）",
  "theme": "卡面主题描述（50字内）"
}
```

## 重要约束
1. ❌ **绝对不能**直接提升Vocal/Dance/Visual三维
2. ✅ **优先使用**：元气、干劲、专注、集中、活力、全力值等属性
3. ✅ **合理搭配**：好调、集中、绝好调、好印象、体力消耗减少等Buff
4. ✅ **创意效果**：技能卡使用数+1、下一张卡效果翻倍、数值上升量增加X%
5. ✅ **培育计划关联**：
   - 感性（Sense）：偏向好调、集中、绝好调、活力
   - 理性（Logic）：偏向好印象、干劲、专注、数值增幅
   - 非凡（Anomaly）：偏向全力值、热意、状态切换（坚决/温存）

---

现在，请开始生成技能卡！
```

#### 1.3 提示词框架文件

`世界书/提示词框架/生卡框架.txt`:

```
# 技能卡生成任务

## 基础信息
- **角色名**: {{角色名}}
- **角色性格**: {{角色性格}}
- **稀有度**: {{稀有度}}
- **培育计划**: {{培育计划}}
- **卡面主题**: {{卡面主题}}

## 参考示例（同稀有度、同培育计划）

### 示例1
```json
{{示例卡1}}
```

### 示例2
```json
{{示例卡2}}
```

### 示例3
```json
{{示例卡3}}
```

## 任务要求
请为角色「{{角色名}}」生成一张{{稀有度}}稀有度的专属技能卡，培育计划为{{培育计划}}，卡面主题为「{{卡面主题}}」。

请严格按照上方的思维链步骤思考，并输出JSON格式的技能卡数据。
```

#### 1.4 技能卡调用区示例

`世界书/技能卡调用区/感性_SSR卡.json`:

```json
[
  {
    "name": "国民のアイドル",
    "nameCN": "国民的偶像",
    "rarity": "SSR",
    "plan": "感性",
    "cardType": "A",
    "cost": "-1",
    "effect_before": "消耗状态良好1回合、下一张卡效果发动2次、技能卡使用数+1、课程中限1次、不可重复",
    "effect_after": "消耗状态良好1回合、下一张卡效果发动2次、技能卡使用数+1、课程中限1次、不可重复"
  },
  {
    "name": "覚醒",
    "nameCN": "觉醒",
    "rarity": "SSR",
    "plan": "感性",
    "cardType": "A",
    "cost": "-3",
    "effect_before": "消耗状态良好1回合、参数+3（2次）、专注+4",
    "effect_after": "消耗状态良好1回合、参数+5（2次）、专注+6"
  },
  {
    "name": "あの夏の輝き",
    "nameCN": "那个夏天的闪耀",
    "rarity": "SSR",
    "plan": "感性",
    "cardType": "M",
    "cost": "0（体力-5）",
    "effect_before": "消耗体力5、好调+4回合、集中+4",
    "effect_after": "消耗体力5、好调+5回合、集中+6"
  }
]
```

---

### 2. 类型定义

`AI生成/类型/生成请求类型.ts`:

```typescript
/**
 * 技能卡生成请求
 */
export interface SkillCardGenerationRequest {
  // 基础信息
  characterId: string;           // 角色ID（如 'mano'）
  characterName: string;          // 角色名（如 '樱木真乃'）
  characterPersona: string;       // 角色性格描述
  
  // P卡信息
  cardId: string;                 // P卡ID
  cardRarity: 'R' | 'SR' | 'SSR' | 'UR'; // P卡稀有度
  cardTheme: string;              // 卡面主题
  
  // 培育计划
  plan: ProducePlan;              // 感性/理性/非凡
  
  // 生成配置
  skillCardRarity?: 'R' | 'SR' | 'SSR' | 'UR'; // 要生成的技能卡稀有度（默认与P卡一致）
}

/**
 * 生成结果
 */
export interface GeneratedSkillCard {
  name: string;                   // 日文名
  nameCN: string;                 // 中文名
  rarity: 'R' | 'SR' | 'SSR' | 'UR';
  plan: ProducePlan;
  cardType: 'A' | 'M';
  cost: string;
  effect_before: string;
  effect_after: string;
  effect_before_cn: string;
  effect_after_cn: string;
  theme: string;
  
  // 绑定信息
  bindingCardId: string;          // 绑定的P卡ID
  isExclusive: true;              // 标记为专属卡
}

/**
 * 世界书条目配置
 */
export interface WorldbookEntryConfig {
  uid: string;
  enabled: boolean;
  constant?: boolean;
}
```

---

### 3. 世界书管理器

`AI生成/服务/世界书管理器.ts`:

```typescript
import { getWorldbooks, updateWorldbookEntry } from '酒馆助手API';

/**
 * 世界书管理器
 * 负责启用/禁用世界书条目
 */
export class WorldbookManager {
  private worldbookName = '偶像大师闪耀色彩';
  
  /**
   * 启用技能卡生成相关条目
   */
  async enableSkillCardGeneration(plan: ProducePlan, rarity: string): Promise<void> {
    console.log(`🌐 配置世界书：计划=${plan}, 稀有度=${rarity}`);
    
    // 1. 启用思维链
    await this.setEntryState('cot_skill_card_generation', true);
    
    // 2. 启用提示词框架
    await this.setEntryState('prompt_framework_skill_card', true);
    
    // 3. 启用对应计划和稀有度的示例卡
    const exampleUid = `example_${this.getPlanKey(plan)}_${rarity.toLowerCase()}`;
    await this.setEntryState(exampleUid, true);
    
    console.log('✅ 世界书配置完成');
  }
  
  /**
   * 禁用技能卡生成相关条目
   */
  async disableSkillCardGeneration(): Promise<void> {
    console.log('🌐 清理世界书配置');
    
    // 禁用思维链
    await this.setEntryState('cot_skill_card_generation', false);
    
    // 禁用提示词框架
    await this.setEntryState('prompt_framework_skill_card', false);
    
    // 禁用所有示例卡
    const plans = ['sense', 'logic', 'anomaly'];
    const rarities = ['r', 'sr', 'ssr'];
    
    for (const plan of plans) {
      for (const rarity of rarities) {
        await this.setEntryState(`example_${plan}_${rarity}`, false);
      }
    }
    
    console.log('✅ 世界书清理完成');
  }
  
  /**
   * 设置条目状态
   */
  private async setEntryState(uid: string, enabled: boolean): Promise<void> {
    try {
      await updateWorldbookEntry(this.worldbookName, uid, { enabled });
      console.log(`  ${enabled ? '✓' : '✗'} ${uid}`);
    } catch (error) {
      console.warn(`无法更新条目 ${uid}:`, error);
    }
  }
  
  /**
   * 获取培育计划的键名
   */
  private getPlanKey(plan: ProducePlan): string {
    const map: Record<ProducePlan, string> = {
      '感性': 'sense',
      '理性': 'logic',
      '非凡': 'anomaly',
      '自由': 'free',
    };
    return map[plan];
  }
}
```

---

### 4. 示例卡选择器

`AI生成/服务/示例卡选择器.ts`:

```typescript
import { filterSkillCards } from '../../战斗';
import type { ProducePlan, SkillCard, SkillCardRarity } from '../../战斗';

/**
 * 示例卡选择器
 * 从数据库中选择合适的示例卡
 */
export class ExampleCardSelector {
  /**
   * 选择示例卡
   * @param plan 培育计划
   * @param rarity 稀有度
   * @param count 数量（默认3张）
   * @returns 示例卡数组
   */
  selectExamples(
    plan: ProducePlan,
    rarity: SkillCardRarity,
    count: number = 3,
  ): SkillCard[] {
    // 从数据库中筛选
    const candidates = filterSkillCards({
      plan,
      rarity,
      isExclusive: false, // 排除已生成的专属卡
    });
    
    if (candidates.length === 0) {
      console.warn(`没有找到${plan}计划的${rarity}卡`);
      return [];
    }
    
    // 随机选择
    const selected: SkillCard[] = [];
    const pool = [...candidates];
    
    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      selected.push(pool[randomIndex]);
      pool.splice(randomIndex, 1);
    }
    
    console.log(`📝 选择了${selected.length}张示例卡:`, selected.map(c => c.name));
    return selected;
  }
  
  /**
   * 格式化示例卡为JSON字符串
   */
  formatExamples(cards: SkillCard[]): string[] {
    return cards.map(card => JSON.stringify({
      name: card.name,
      rarity: card.rarity,
      plan: card.plan,
      cardType: card.cardType,
      cost: card.cost,
      effect_before: card.effect_before,
      effect_after: card.effect_after,
    }, null, 2));
  }
}
```

---

### 5. 提示词构建器

`AI生成/服务/提示词构建器.ts`:

```typescript
import type { SkillCardGenerationRequest } from '../类型/生成请求类型';
import type { SkillCard } from '../../战斗';
import { ExampleCardSelector } from './示例卡选择器';

/**
 * 提示词构建器
 * 组装完整的技能卡生成提示词
 */
export class PromptBuilder {
  private selector = new ExampleCardSelector();
  
  /**
   * 构建完整提示词
   */
  buildPrompt(request: SkillCardGenerationRequest): string {
    const {
      characterName,
      characterPersona,
      cardRarity,
      cardTheme,
      plan,
      skillCardRarity,
    } = request;
    
    const rarity = skillCardRarity || cardRarity;
    
    // 1. 选择示例卡
    const examples = this.selector.selectExamples(plan, rarity, 3);
    const exampleJsons = this.selector.formatExamples(examples);
    
    // 2. 构建提示词
    const prompt = `
# 技能卡生成任务

## 基础信息
- **角色名**: ${characterName}
- **角色性格**: ${characterPersona}
- **稀有度**: ${rarity}
- **培育计划**: ${plan}
- **卡面主题**: ${cardTheme}

## 参考示例（同稀有度、同培育计划）

### 示例1
\`\`\`json
${exampleJsons[0] || '{}'}
\`\`\`

### 示例2
\`\`\`json
${exampleJsons[1] || '{}'}
\`\`\`

### 示例3
\`\`\`json
${exampleJsons[2] || '{}'}
\`\`\`

## 任务要求
请为角色「${characterName}」生成一张${rarity}稀有度的专属技能卡，培育计划为${plan}，卡面主题为「${cardTheme}」。

请严格按照思维链步骤思考，并**仅输出**JSON格式的技能卡数据（不要有任何额外的说明文字）。

期待的JSON格式：
\`\`\`json
{
  "name": "技能卡名称（日文）",
  "nameCN": "技能卡名称（中文）",
  "rarity": "${rarity}",
  "plan": "${plan}",
  "cardType": "A",
  "cost": "-3",
  "effect_before": "强化前效果（日文）",
  "effect_after": "强化后效果（日文）",
  "effect_before_cn": "强化前效果（中文）",
  "effect_after_cn": "强化后效果（中文）",
  "theme": "卡面主题描述"
}
\`\`\`
`.trim();
    
    return prompt;
  }
}
```

---

### 6. 技能卡生成器（主控制器）

`AI生成/服务/技能卡生成器.ts`:

```typescript
import { z } from 'zod';
import type { SkillCardGenerationRequest, GeneratedSkillCard } from '../类型/生成请求类型';
import { WorldbookManager } from './世界书管理器';
import { PromptBuilder } from './提示词构建器';
import { MessageService } from '../../通信/消息服务';

/**
 * 技能卡生成器
 * 主控制器，协调整个生成流程
 */
export class SkillCardGenerator {
  private worldbookManager = new WorldbookManager();
  private promptBuilder = new PromptBuilder();
  
  /**
   * 生成技能卡
   */
  async generate(request: SkillCardGenerationRequest): Promise<GeneratedSkillCard> {
    console.log('🎴 开始生成技能卡...');
    console.log('请求:', request);
    
    try {
      // 1. 配置世界书（启用思维链和示例卡）
      await this.worldbookManager.enableSkillCardGeneration(
        request.plan,
        request.skillCardRarity || request.cardRarity,
      );
      
      // 2. 构建提示词
      const prompt = this.promptBuilder.buildPrompt(request);
      console.log('📝 提示词已构建');
      console.log('---\n' + prompt + '\n---');
      
      // 3. 发送给LLM
      console.log('🚀 发送给LLM...');
      const response = await this.callLLM(prompt);
      console.log('✅ LLM响应:', response);
      
      // 4. 解析响应
      const skillCard = this.parseResponse(response, request);
      console.log('✅ 技能卡解析成功:', skillCard);
      
      // 5. 存入IndexedDB
      await this.saveToDatabase(skillCard);
      console.log('💾 已存入数据库');
      
      // 6. 清理世界书配置
      await this.worldbookManager.disableSkillCardGeneration();
      
      return skillCard;
    } catch (error) {
      // 确保清理世界书
      await this.worldbookManager.disableSkillCardGeneration();
      throw error;
    }
  }
  
  /**
   * 调用LLM
   */
  private async callLLM(prompt: string): Promise<string> {
    // 使用通信系统发送给SillyTavern
    const aiMessage = await MessageService.sendMessage({
      userInput: prompt,
      enableStream: false, // 生成技能卡不需要流式输出
    });
    
    return aiMessage.content;
  }
  
  /**
   * 解析LLM响应
   */
  private parseResponse(
    response: string,
    request: SkillCardGenerationRequest,
  ): GeneratedSkillCard {
    // 提取JSON（可能被包裹在```json```中）
    let jsonText = response.trim();
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    // 解析JSON
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      throw new Error(`JSON解析失败: ${error}\n原文:\n${jsonText}`);
    }
    
    // 验证格式
    const schema = z.object({
      name: z.string(),
      nameCN: z.string(),
      rarity: z.enum(['R', 'SR', 'SSR', 'UR']),
      plan: z.enum(['感性', '理性', '非凡', '自由']),
      cardType: z.enum(['A', 'M']),
      cost: z.string(),
      effect_before: z.string(),
      effect_after: z.string(),
      effect_before_cn: z.string(),
      effect_after_cn: z.string(),
      theme: z.string(),
    });
    
    const validated = schema.parse(parsed);
    
    // 添加绑定信息
    return {
      ...validated,
      bindingCardId: request.cardId,
      isExclusive: true,
    };
  }
  
  /**
   * 存入IndexedDB
   */
  private async saveToDatabase(skillCard: GeneratedSkillCard): Promise<void> {
    // 打开IndexedDB
    const db = await this.openDatabase();
    
    // 存储技能卡
    const transaction = db.transaction(['exclusiveSkillCards'], 'readwrite');
    const store = transaction.objectStore('exclusiveSkillCards');
    
    const cardData = {
      id: `exclusive_${skillCard.bindingCardId}_${Date.now()}`,
      ...skillCard,
      createdAt: new Date(),
    };
    
    await store.add(cardData);
    
    console.log('💾 技能卡已存入IndexedDB:', cardData.id);
  }
  
  /**
   * 打开IndexedDB
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('IdolMasterDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('exclusiveSkillCards')) {
          db.createObjectStore('exclusiveSkillCards', { keyPath: 'id' });
        }
      };
    });
  }
}
```

---

### 7. UI组件

`AI生成/界面/生成技能卡按钮.vue`:

```vue
<template>
  <div class="skill-card-generator">
    <button
      @click="generateSkillCard"
      :disabled="isGenerating"
      class="generate-button"
    >
      <span v-if="!isGenerating">🎴 生成专属技能卡</span>
      <span v-else>⏳ 生成中...</span>
    </button>
    
    <div v-if="generatedCard" class="result">
      <h3>✅ 生成成功！</h3>
      <div class="card-preview">
        <div class="card-name">{{ generatedCard.nameCN }}</div>
        <div class="card-rarity">{{ generatedCard.rarity }}</div>
        <div class="card-cost">Cost: {{ generatedCard.cost }}</div>
        <div class="card-effect">
          <strong>效果：</strong>
          <p>{{ generatedCard.effect_before_cn }}</p>
        </div>
      </div>
    </div>
    
    <div v-if="errorMessage" class="error">
      ❌ {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SkillCardGenerator } from '../服务/技能卡生成器';
import type { SkillCardGenerationRequest, GeneratedSkillCard } from '../类型/生成请求类型';

// Props
const props = defineProps<{
  characterId: string;
  characterName: string;
  characterPersona: string;
  cardId: string;
  cardRarity: 'R' | 'SR' | 'SSR' | 'UR';
  cardTheme: string;
  plan: '感性' | '理性' | '非凡';
}>();

// 状态
const isGenerating = ref(false);
const generatedCard = ref<GeneratedSkillCard | null>(null);
const errorMessage = ref('');

// 生成器实例
const generator = new SkillCardGenerator();

// 生成技能卡
async function generateSkillCard() {
  isGenerating.value = true;
  errorMessage.value = '';
  generatedCard.value = null;
  
  try {
    const request: SkillCardGenerationRequest = {
      characterId: props.characterId,
      characterName: props.characterName,
      characterPersona: props.characterPersona,
      cardId: props.cardId,
      cardRarity: props.cardRarity,
      cardTheme: props.cardTheme,
      plan: props.plan,
    };
    
    const card = await generator.generate(request);
    generatedCard.value = card;
  } catch (error) {
    console.error('生成失败:', error);
    errorMessage.value = error instanceof Error ? error.message : '未知错误';
  } finally {
    isGenerating.value = false;
  }
}
</script>

<style scoped lang="scss">
.skill-card-generator {
  padding: 20px;
  
  .generate-button {
    padding: 15px 30px;
    font-size: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .result {
    margin-top: 20px;
    padding: 20px;
    background: #f0f9ff;
    border-radius: 10px;
    
    .card-preview {
      margin-top: 10px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      .card-name {
        font-size: 20px;
        font-weight: bold;
        color: #1e40af;
      }
      
      .card-rarity {
        margin-top: 5px;
        font-size: 14px;
        color: #7c3aed;
      }
      
      .card-cost {
        margin-top: 5px;
        font-size: 14px;
        color: #dc2626;
      }
      
      .card-effect {
        margin-top: 10px;
        
        strong {
          color: #059669;
        }
        
        p {
          margin-top: 5px;
          color: #374151;
          line-height: 1.6;
        }
      }
    }
  }
  
  .error {
    margin-top: 20px;
    padding: 15px;
    background: #fee2e2;
    border: 1px solid #ef4444;
    border-radius: 8px;
    color: #dc2626;
  }
}
</style>
```

---

## 🎮 使用示例

### 在P卡详情页中使用

```vue
<template>
  <div class="card-detail">
    <h2>{{ card.name }}</h2>
    <p>稀有度: {{ card.rarity }}</p>
    <p>培育计划: {{ card.plan }}</p>
    
    <!-- 生成专属技能卡按钮 -->
    <SkillCardGeneratorButton
      :character-id="card.characterId"
      :character-name="card.characterName"
      :character-persona="getCharacterPersona(card.characterId)"
      :card-id="card.id"
      :card-rarity="card.rarity"
      :card-theme="card.theme"
      :plan="card.plan"
    />
  </div>
</template>

<script setup lang="ts">
import SkillCardGeneratorButton from '../AI生成/界面/生成技能卡按钮.vue';
import { IDOLS } from '../角色管理/角色数据';

function getCharacterPersona(characterId: string): string {
  const idol = IDOLS.find(i => i.id === characterId);
  return idol?.description || '';
}
</script>
```

---

## ✅ 优势

1. **完全自动化**：点击按钮即可生成，无需手动操作
2. **深度集成SillyTavern**：利用世界书、变量、通信系统
3. **智能示例选择**：自动从数据库中选择相同计划和稀有度的卡牌作为示例
4. **思维链引导**：确保AI生成高质量的技能卡
5. **类型安全**：Zod验证确保数据格式正确
6. **持久化存储**：自动存入IndexedDB，永久保存

---

## 🔮 未来扩展

1. **批量生成**：一次生成多张技能卡
2. **重新生成**：不满意可以重新生成
3. **手动编辑**：生成后可以手动修改
4. **分享系统**：将生成的技能卡分享给其他玩家
5. **AI评分**：让AI评估技能卡的平衡性

---

**最后更新**: 2025-11-03  
**版本**: v1.0.0


