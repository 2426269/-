# ✅ 项目大纲更新完成 - Phase 1.6 监听与拦截系统

**更新时间**: 2025-11-01  
**更新版本**: v1.1

---

## 📋 更新概述

根据用户需求，对项目开发大纲进行了重大更新，主要集中在：

1. **数据存储方案变更**：从 localStorage 升级到 IndexedDB
2. **Phase 1.6 功能明确**：从简单的"iframe通信系统"扩展为"监听与拦截系统"
3. **架构图完善**：增加了清晰的系统架构图

---

## 🔄 主要变更

### 1. 数据持久化方案升级（Phase 1.5）

#### 变更前
- **存储方式**: 完全使用 localStorage
- **限制**: 
  - 数据量限制（~5-10MB）
  - 同步操作可能阻塞UI
  - 不支持复杂查询

#### 变更后
- **存储方式**: IndexedDB（主要） + localStorage（轻量配置）
- **优势**:
  - 大容量存储（GB级别）
  - 异步操作不阻塞UI
  - 支持索引和复杂查询
  - 更适合游戏数据存储

#### IndexedDB 数据库结构

```typescript
数据库名: ShinyColorsDB
版本: 1

ObjectStores:
1. resources     - 资源数据（羽石、粉丝、等级）
2. gacha         - 抽卡数据（星尘、拥有卡牌、保底）
3. affection     - 好感度数据（28个偶像）
4. produce       - 培育会话数据
5. skillCards    - 技能卡数据库（AI生成 + 官方）
6. stories       - 剧情记录（可回放）
```

#### 封装API

```typescript
class ShinyColorsDB {
  async init(): Promise<void>
  async get(storeName: string, key: string): Promise<any>
  async put(storeName: string, data: any): Promise<void>
  async delete(storeName: string, key: string): Promise<void>
  async getAll(storeName: string): Promise<any[]>
}

// 全局单例
export const db = new ShinyColorsDB();
```

#### 响应式数据同步

```typescript
// Vue响应式数据 ↔ IndexedDB 自动同步
watchEffect(async () => {
  const data = klona(resources.value);  // 去除proxy
  await db.put('resources', { id: 'main', ...data });
});
```

---

### 2. Phase 1.6 功能明确化

#### 变更前
- **名称**: iframe通信系统
- **职责**: 简单的 postMessage 双向通信

#### 变更后
- **名称**: iframe监听与拦截系统
- **职责**: 
  1. **监听** Vue前端事件（抽卡、训练、活动等）
  2. **组装** 完整提示词（使用PromptFactory）
  3. **发送** 提示词给SillyTavern AI
  4. **拦截** AI回复
  5. **解析** 数据（技能卡JSON、剧情文本、奖励）
  6. **写入** IndexedDB
  7. **注入** Galgame剧情界面

#### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         Vue 前端界面                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ 抽卡系统   │  │ 培育系统   │  │ 音乐播放器 │             │
│  └─────┬──────┘  └─────┬──────┘  └────────────┘             │
│        │               │                                      │
│        │    事件触发   │                                      │
│        ▼               ▼                                      │
│  ┌─────────────────────────────────────────┐                 │
│  │   Communication Module (通信模块)      │                 │
│  │  · 监听前端事件                         │                 │
│  │  · 组装完整提示词（PromptFactory）      │                 │
│  │  · 发送postMessage                      │                 │
│  │  · 接收AI回复                           │                 │
│  │  · 解析数据写入IndexedDB                │                 │
│  │  · 注入Galgame剧情界面                  │                 │
│  └───────────┬─────────────────────────────┘                 │
│              │ postMessage                                    │
└──────────────┼────────────────────────────────────────────────┘
               │
               │ iframe boundary
               │
┌──────────────▼────────────────────────────────────────────────┐
│                    SillyTavern (Loader)                       │
│  ┌──────────────────────────────────────────┐                 │
│  │   idolmaster_loader.html                │                 │
│  │  · 监听Vue的postMessage                 │                 │
│  │  · 发送提示词给AI                       │                 │
│  │  · 拦截AI回复（MESSAGE_RECEIVED）       │                 │
│  │  · 静默处理（不显示在聊天界面）         │                 │
│  │  · 转发回Vue                            │                 │
│  └───────────┬──────────────────────────────┘                 │
│              │                                                 │
│              ▼                                                 │
│      ┌──────────────┐                                         │
│      │   AI Model   │                                         │
│      └──────────────┘                                         │
└───────────────────────────────────────────────────────────────┘
```

---

## 🎯 四大核心功能

### 功能1: 监听前端事件并发送AI请求

**触发点**:
- 抽卡事件 → 生成技能卡
- 训练完成 → 生成训练后剧情
- 自由活动 → 生成互动剧情
- 比赛结束 → 生成结局剧情

**实现方式**:
```typescript
eventBus.on('CARD_PULLED', async (card) => {
  const prompt = PromptFactory.assemblePrompt('GENERATE_SKILL', {...});
  sendToSillyTavern({
    type: 'GENERATE_SKILL_CARD',
    payload: { prompt, cardId: card.id, bot_name: 'Card Generation Bot' }
  });
});
```

### 功能2: 拦截AI回复并处理

**处理流程**:
1. 接收AI回复（postMessage）
2. 解析数据（JSON / 文本标签）
3. 验证数据（Zod Schema）
4. 写入IndexedDB
5. 触发UI更新

**技能卡生成**:
```typescript
window.addEventListener('message', async (event) => {
  if (event.data.type === 'AI_SKILL_CARD_RESPONSE') {
    const skill = JSON.parse(event.data.payload.skillData);
    await db.put('skillCards', { ...skill, source: 'ai' });
    toastr.success(`✨ ${skill.name} 技能卡生成成功！`);
  }
});
```

**剧情生成**:
```typescript
window.addEventListener('message', async (event) => {
  if (event.data.type === 'AI_STORY_RESPONSE') {
    const parsed = parseStoryText(event.data.payload.storyText);
    await db.put('stories', { ...parsed, timestamp: Date.now() });
    await showGalDialogue({ text: parsed.text, character: metadata.idolId });
  }
});
```

### 功能3: SillyTavern端拦截与转发

**Loader脚本职责**:
- 监听Vue的postMessage
- 切换AI Bot（如需要）
- 发送提示词给AI（静默模式）
- 拦截AI回复（MESSAGE_RECEIVED事件）
- 删除聊天记录（静默处理）
- 转发回Vue

**关键代码**:
```javascript
// 拦截AI回复
eventOn(tavern_events.MESSAGE_RECEIVED, (messageId) => {
  const message = SillyTavern.chat[messageId];
  const aiText = message.mes;
  
  // 转发回Vue
  iframeWindow.postMessage({
    type: 'AI_SKILL_CARD_RESPONSE' | 'AI_STORY_RESPONSE',
    payload: { ... }
  }, '*');
  
  // 静默处理（删除消息）
  SillyTavern.chat.splice(messageId, 1);
  SillyTavern.saveChatConditional();
});
```

### 功能4: Galgame剧情界面

**组件**: GalDialogue.vue

**功能**:
- 角色立绘（支持表情切换）
- 背景图片（虚化效果）
- 对话框（打字机效果，GSAP动画）
- 奖励应用（体力、好感度、属性）

**使用方式**:
```typescript
await showGalDialogue({
  character: 'mano',
  text: '制作人，今天的训练辛苦了！',
  expression: 'happy',
  background: 'studio'
});
```

---

## 🎉 核心优势

### 1. 自动化流程
```
抽卡 → 自动生成技能卡 → 自动写入数据库 → 自动更新UI
```
用户无需手动操作，一切都是自动的。

### 2. 沉浸式体验
- ❌ 不再看到SillyTavern的聊天界面
- ✅ 所有剧情以**Galgame形式**展现
- ✅ 角色立绘 + 背景 + 打字机效果
- ✅ 完全的游戏化体验

### 3. 数据持久化
- 所有AI生成的技能卡保存在IndexedDB
- 所有AI生成的剧情保存在IndexedDB
- 支持**剧情回放**功能
- 支持**技能卡查询**功能

### 4. 完全静默
- 用户看不到SillyTavern的聊天气泡
- 所有AI请求和回复都是静默的
- 前端界面是唯一的交互界面

---

## 📦 交付物清单

### Phase 1.5（数据持久化）
- ✅ `src/偶像大师闪耀色彩/db.ts` - IndexedDB封装类
- ✅ 数据迁移脚本（localStorage → IndexedDB）
- ✅ 响应式数据同步逻辑

### Phase 1.6（监听与拦截系统）
- ❌ `idolmaster_loader.html` - SillyTavern端Loader脚本
- ❌ `src/偶像大师闪耀色彩/communication.ts` - 通信模块
- ❌ `src/偶像大师闪耀色彩/components/GalDialogue.vue` - Galgame对话框
- ❌ `src/偶像大师闪耀色彩/story-parser.ts` - 剧情解析器
- ❌ 通信协议文档

---

## 🔜 下一步行动

### 立即优先级（本周）
1. ✅ 完成大纲更新（已完成）
2. ⏭️ 实现IndexedDB封装类（`db.ts`）
3. ⏭️ 实现通信模块（`communication.ts`）
4. ⏭️ 创建Loader脚本（`idolmaster_loader.html`）

### 短期目标（本月）
1. 完成Phase 1.6所有功能
2. 测试技能卡生成流程（抽卡 → AI生成 → 写入DB → UI更新）
3. 测试剧情生成流程（事件 → AI生成 → Galgame展示 → 奖励应用）
4. 开始Phase 2.0（提示词加工厂）

---

## 📊 架构对比

### 旧架构（纯localStorage）
```
Vue App
  └─ localStorage
       ├─ resources
       ├─ gacha
       └─ affection
```

**限制**:
- 数据量限制（5-10MB）
- 同步操作阻塞UI
- 无法存储大量AI生成内容

### 新架构（IndexedDB + 监听拦截）
```
Vue App
  └─ IndexedDB (ShinyColorsDB)
       ├─ resources        (资源)
       ├─ gacha            (抽卡)
       ├─ affection        (好感度)
       ├─ produce          (培育会话)
       ├─ skillCards       (技能卡，支持AI生成)
       └─ stories          (剧情记录，可回放)
  
  └─ Communication Module
       ├─ 监听事件（抽卡、训练、活动）
       ├─ 组装提示词（PromptFactory）
       ├─ 发送请求（postMessage）
       ├─ 拦截回复（postMessage）
       ├─ 解析数据（JSON/标签）
       └─ 写入数据库（IndexedDB）
  
  └─ Galgame Dialogue
       ├─ 角色立绘
       ├─ 背景图片
       ├─ 打字机效果
       └─ 奖励应用
```

**优势**:
- 无限存储（GB级别）
- 异步操作不阻塞
- 支持复杂查询和索引
- 完整的AI内容管理
- 沉浸式游戏体验

---

## ✨ 总结

本次更新将项目架构提升到了一个新的层次：

1. **数据存储升级**: localStorage → IndexedDB，支持大规模数据存储
2. **通信系统完善**: 从简单通信升级为完整的监听与拦截系统
3. **用户体验提升**: 从聊天界面升级为Galgame界面，沉浸感大幅提升
4. **自动化程度**: 技能卡生成、剧情生成、数据存储全自动化

这些变更为后续的Phase 2（核心玩法）和Phase 3（AI叙事集成）奠定了坚实的基础。

---

**文档状态**: ✅ 已完成  
**下一步**: 开始实现 IndexedDB 封装类（`db.ts`）











