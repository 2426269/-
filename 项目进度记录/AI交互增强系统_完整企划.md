# 偶像大师闪耀色彩 - AI交互增强系统企划

## 📋 企划概览

**创建时间**: 2025-10-29  
**优先级**: 中高  
**实施阶段**: Phase 2-3  
**技术难度**: ⭐⭐⭐⭐☆  
**预期价值**: ⭐⭐⭐⭐⭐  

---

## 🎯 核心目标

将当前的**纯前端游戏系统**升级为**AI驱动的交互式卡片**，实现：
- AI 可感知玩家状态（羽石、等级、拥有角色等）
- AI 可主动触发游戏事件（抽卡、任务、剧情）
- AI 回复与游戏逻辑无缝融合
- 保持前端即时响应和数据持久化

---

## 📖 技术背景（源自Gemini对话）

### 当前架构
```
前端界面 (Vue.js)
    ↓
localStorage（仅前端可见）
    ↓
数据持久化（刷新不丢失）
```

### 目标架构
```
前端界面 (Vue.js)
    ↓
localStorage + MVU变量（双存储）
    ↑           ↓
前端即时     AI可读取
    ↓           ↓
chat:received 拦截器
    ↓
AI回复 → 解析标签 → 更新游戏
```

---

## 🔧 核心技术方案

### 1. **双存储策略：localStorage + MVU变量**

#### 1.1 工作原理
- **localStorage**: 前端即时响应，防刷新丢失
- **MVU变量**: SillyTavern后端存储，AI可读取

#### 1.2 同步机制
```typescript
// 初始化时：优先从MVU读取
async function initializeGems() {
  // 1. 从MVU读取主数据
  let masterGems = await evalTemplate(`{{v::gems}}`);
  
  // 2. 如果是首次，设置初始值
  if (masterGems === `{{v::gems}}`) {
    currentUserGems = 3000;
    updateAllStorage(currentUserGems);
  } else {
    // 3. 使用MVU数据，并同步到localStorage
    currentUserGems = parseInt(masterGems, 10);
    localStorage.setItem('gems', currentUserGems);
  }
}

// 发生变动时：同时更新两处
function updateAllStorage(newValue) {
  // 1. 立刻更新localStorage（即时响应）
  localStorage.setItem('gems', newValue);
  
  // 2. 立刻更新前端显示
  updateGemsDisplay();
  
  // 3. 后台更新MVU（告诉AI）
  SillyTavern.Api.command(`/setvar gems ${newValue}`, true);
}
```

#### 1.3 需要同步的变量
| 变量名       | MVU键名                | 说明       | 优先级 |
| ------------ | ---------------------- | ---------- | ------ |
| 羽石         | `{{v::gems}}`          | 抽卡货币   | 🔴 高   |
| 等级         | `{{v::producerLevel}}` | 制作人等级 | 🔴 高   |
| 经验值       | `{{v::producerExp}}`   | 升级进度   | 🟡 中   |
| 拥有角色     | `{{v::ownedIdols}}`    | JSON字符串 | 🔴 高   |
| 星尘         | `{{v::stardust}}`      | 副货币     | 🟡 中   |
| 粉丝数       | `{{v::fans}}`          | 影响力     | 🟢 低   |
| 当前剧情进度 | `{{v::storyProgress}}` | 已解锁章节 | 🟡 中   |

---

### 2. **AI交互系统：chat:received拦截**

#### 2.1 核心概念
**"0层卡"技术**：在AI回复生成聊天气泡**之前**拦截消息，提取数据并静默更新UI。

#### 2.2 实现方式
```typescript
// 在常驻脚本（World UI或user-scripts.js）中监听
SillyTavern.Api.Events.on('chat:received', (message) => {
  // 只处理AI的回复
  if (message.is_user === false && message.message) {
    let originalMessage = message.message;
    let messageWasModified = false;

    // === 抽卡结果拦截 ===
    const gachaMatch = originalMessage.match(/<gacha_result>(.*?)<\/gacha_result>/s);
    if (gachaMatch) {
      const gachaData = JSON.parse(gachaMatch[1]);
      // { "cards": [{"name": "樱木真乃", "rarity": "SSR"}], "newGems": 0 }
      
      handleGachaResult(gachaData);
      
      // "偷走"标签，避免显示在聊天中
      originalMessage = originalMessage.replace(/<gacha_result>.*?<\/gacha_result>/s, "");
      messageWasModified = true;
    }

    // === 任务奖励拦截 ===
    const rewardMatch = originalMessage.match(/<reward>(.*?)<\/reward>/s);
    if (rewardMatch) {
      const rewardData = JSON.parse(rewardMatch[1]);
      // { "gems": 500, "exp": 100, "items": [...] }
      
      handleReward(rewardData);
      
      originalMessage = originalMessage.replace(/<reward>.*?<\/reward>/s, "");
      messageWasModified = true;
    }

    // === 状态更新拦截 ===
    const statusMatch = originalMessage.match(/<status>(.*?)<\/status>/s);
    if (statusMatch) {
      const statusData = JSON.parse(statusMatch[1]);
      // { "mood": "开心", "outfit": "舞台服" }
      
      updateCharacterStatus(statusData);
      
      originalMessage = originalMessage.replace(/<status>.*?<\/status>/s, "");
      messageWasModified = true;
    }

    // 如果处理了数据，将修改后的消息写回
    if (messageWasModified) {
      message.message = originalMessage.trim();
      message.swipes = [message.message];
      
      // 如果originalMessage是空字符串，SillyTavern不会显示任何气泡
      // 实现了"静默更新0层卡"
    }
  }
});
```

#### 2.3 支持的标签系统
| 标签              | 数据格式 | 功能         | 示例                                             |
| ----------------- | -------- | ------------ | ------------------------------------------------ |
| `<gacha_result>`  | JSON     | AI驱动的抽卡 | `{"cards":[{"name":"樱木真乃","rarity":"SSR"}]}` |
| `<reward>`        | JSON     | 任务奖励     | `{"gems":500,"exp":100}`                         |
| `<status>`        | JSON     | 角色状态更新 | `{"mood":"开心","outfit":"舞台服"}`              |
| `<battle_result>` | JSON     | 副本结果     | `{"score":"S","gems":300}`                       |
| `<story_unlock>`  | JSON     | 剧情解锁     | `{"chapter":2,"scene":5}`                        |
| `<special_event>` | JSON     | 特殊事件     | `{"type":"festival","bonus":1.5}`                |

---

### 3. **AI提示词集成**

#### 3.1 系统提示词注入
```yaml
# 在角色卡的System Prompt中添加：

你是《偶像大师闪耀色彩》的游戏系统AI。你可以使用特殊标签来控制游戏逻辑。

## 当前玩家状态（自动更新）
- 羽石: {{v::gems}}
- 等级: Lv.{{v::producerLevel}}
- 经验: {{v::producerExp}}/{{v::nextLevelExp}}
- 拥有偶像: {{v::ownedIdols}}
- 星尘: {{v::stardust}}

## 可用标签

### 1. 抽卡结果
当玩家请求抽卡时，使用：
<gacha_result>
{"cards":[{"name":"偶像名","rarity":"稀有度"}],"newGems":剩余羽石}
</gacha_result>

示例：
制作人，你抽到了SSR樱木真乃！真是太幸运了！
<gacha_result>
{"cards":[{"name":"樱木真乃","rarity":"SSR"}],"newGems":0}
</gacha_result>

### 2. 任务奖励
当玩家完成任务时：
<reward>
{"gems":数量,"exp":数量,"reason":"原因"}
</reward>

### 3. 角色状态
更新角色心情、服装等：
<status>
{"mood":"情绪","outfit":"服装","location":"位置"}
</status>

## 规则
1. 标签内容必须是有效的JSON格式
2. 标签可以和普通对话混用
3. 如果整条消息只有标签，用户不会看到聊天气泡（静默更新）
4. 抽卡时必须检查{{v::gems}}是否足够
5. 稀有度必须是：R, SR, SSR, UR 之一
```

#### 3.2 示例对话流程
```
用户: "我想抽一次十连！"

AI（内部思考）:
- 检查 {{v::gems}} = 3000（足够）
- 模拟抽卡（1个SSR，9个R）
- 扣除羽石 3000

AI（回复）:
制作人，准备好了吗？让我们一起见证奇迹！
<gacha_result>
{
  "cards": [
    {"name": "樱木真乃", "rarity": "SSR"},
    {"name": "风野灯织", "rarity": "R"},
    ... 其他8张R卡
  ],
  "newGems": 0
}
</gacha_result>
太棒了！你抽到了SSR樱木真乃！

→ 前端拦截器：
  1. 提取标签中的JSON数据
  2. 显示精美的抽卡动画
  3. 更新羽石到0
  4. 更新localStorage和MVU
  5. 显示"太棒了！你抽到了SSR樱木真乃！"对话
```

---

### 4. **0层卡通信机制（高级）**

#### 4.1 问题背景
如果Vue应用在`<iframe>`中，且需要与外层SillyTavern通信。

#### 4.2 postMessage通信
```typescript
// === SillyTavern端（外层）===
const iframe = document.getElementById('idolmaster-app-frame');
const iframeWindow = iframe.contentWindow;
const vueAppOrigin = 'http://localhost:5500';

// 监听来自Vue应用的消息
window.addEventListener('message', (event) => {
  if (event.origin !== vueAppOrigin) return;
  
  const { type, payload } = event.data;
  
  if (type === 'REQUEST_GACHA') {
    // Vue请求抽卡，让AI执行
    SillyTavern.Api.command(`/say 制作人想抽卡！`, false);
  }
  
  if (type === 'SET_UI_MODE') {
    // Vue请求切换UI模式（可点击/透明）
    if (payload.interactive) {
      iframe.classList.add('active');
    } else {
      iframe.classList.remove('active');
    }
  }
});

// 发送AI回复数据给Vue
SillyTavern.Api.Events.on('chat:received', (message) => {
  const gachaMatch = message.message.match(/<gacha_result>(.*?)<\/gacha_result>/s);
  if (gachaMatch) {
    iframeWindow.postMessage({
      type: 'GACHA_RESULT',
      payload: JSON.parse(gachaMatch[1])
    }, vueAppOrigin);
  }
});

// === Vue应用端（iframe内）===
const sillyTavernOrigin = 'http://localhost:8000';

// 监听来自SillyTavern的消息
window.addEventListener('message', (event) => {
  if (event.origin !== sillyTavernOrigin) return;
  
  const { type, payload } = event.data;
  
  if (type === 'GACHA_RESULT') {
    // 显示抽卡结果
    showGachaAnimation(payload.cards);
    updateGems(payload.newGems);
  }
});

// 发送请求给SillyTavern
function requestGacha() {
  window.parent.postMessage({
    type: 'REQUEST_GACHA',
    payload: { poolName: '常驻卡池' }
  }, sillyTavernOrigin);
}
```

---

## 📊 实施路线图

### Phase 2.1：MVU变量集成（基础）
**预计工时**: 2-3天  
**优先级**: 🔴 高  

**任务清单**:
- [ ] 创建`mvu-sync.ts`模块
- [ ] 实现`initFromMVU()`初始化函数
- [ ] 实现`syncToMVU(key, value)`同步函数
- [ ] 修改`app.vue`加载逻辑，优先从MVU读取
- [ ] 在抽卡/升级等关键操作后调用同步
- [ ] 测试刷新后数据一致性

**成功标准**:
- ✅ 刷新页面后，羽石等数据从MVU正确读取
- ✅ 抽卡后，MVU变量立刻更新
- ✅ 在SillyTavern的变量编辑器中能看到实时变化

---

### Phase 2.2：chat:received拦截器（核心）
**预计工时**: 3-4天  
**优先级**: 🔴 高  

**任务清单**:
- [ ] 创建`ai-interceptor.ts`模块
- [ ] 实现标签解析器（正则+JSON解析）
- [ ] 实现`handleGachaResult()`处理函数
- [ ] 实现`handleReward()`处理函数
- [ ] 实现`handleStatus()`处理函数
- [ ] 在`index.ts`中注册监听器
- [ ] 错误处理和降级方案

**成功标准**:
- ✅ AI回复`<gacha_result>...</gacha_result>`时，前端正确解析
- ✅ 抽卡动画正常播放
- ✅ 如果标签格式错误，不影响正常对话
- ✅ 只有标签的消息不显示聊天气泡

---

### Phase 2.3：AI提示词设计（内容）
**预计工时**: 1-2天  
**优先级**: 🟡 中  

**任务清单**:
- [ ] 编写完整的System Prompt
- [ ] 设计标签使用示例
- [ ] 编写AI抽卡逻辑指南
- [ ] 测试AI是否正确使用标签
- [ ] 调整提示词优化准确率

**成功标准**:
- ✅ AI能在90%的情况下正确使用标签
- ✅ AI能根据`{{v::gems}}`判断是否可抽卡
- ✅ AI生成的JSON格式错误率<5%

---

### Phase 3.1：postMessage通信（可选）
**预计工时**: 2-3天  
**优先级**: 🟢 低  

**任务清单**:
- [ ] 创建`bridge.ts`通信模块
- [ ] 实现消息类型定义（TypeScript接口）
- [ ] 实现双向消息验证（origin检查）
- [ ] 测试iframe通信稳定性

**成功标准**:
- ✅ Vue可请求外层执行AI命令
- ✅ 外层可将AI回复传入Vue
- ✅ 消息安全性验证通过

---

## 🎮 用户体验示例

### 场景1：AI驱动的抽卡
```
用户: "真乃，我想抽卡！"

真乃（AI）:
"好的，制作人！让我帮你看看...你现在有 {{v::gems}} 羽石，
可以进行一次十连呢！准备好了吗？"

用户: "来吧！"

真乃（AI）:
"那我们开始吧！✨"
<gacha_result>
{"cards":[{"name":"樱木真乃","rarity":"SSR"}],"newGems":0}
</gacha_result>
"哇！制作人抽到了SSR的我！真是太好了！"

→ 前端显示：
  [精美的抽卡动画]
  [卡片翻转特效]
  [SSR金色光芒]
  [樱木真乃 SSR 卡面展示]
```

### 场景2：任务奖励
```
用户: "真乃，我完成了今天的培育任务！"

真乃（AI）:
"制作人辛苦了！让我给你结算奖励吧~"
<reward>
{"gems":500,"exp":200,"reason":"完成每日培育任务"}
</reward>
"你获得了500羽石和200经验值！继续加油哦！"

→ 前端显示：
  [奖励弹窗动画]
  羽石: 0 → 500 ⬆️
  经验: 0/1000 → 200/1000
  [进度条动画]
```

### 场景3：剧情解锁
```
真乃（AI）:
"制作人，你的等级提升到了10级！解锁了新的剧情章节！"
<story_unlock>
{"chapter":2,"scene":1,"title":"初次的舞台"}
</story_unlock>
<reward>
{"gems":1000,"reason":"等级10奖励"}
</reward>
"还有1000羽石作为奖励呢！"

→ 前端显示：
  [等级提升特效]
  [新章节解锁动画]
  [奖励领取界面]
```

---

## ⚠️ 技术风险与应对

### 风险1：MVU变量冲突
**问题**: 多个标签页同时修改同一个MVU变量  
**应对**: 
- 使用`localStorage`作为主存储
- MVU仅作为"AI可读"的备份
- 只在关键节点同步MVU（抽卡后、退出前）

### 风险2：AI生成无效JSON
**问题**: AI回复的标签内JSON格式错误  
**应对**:
```typescript
try {
  const data = JSON.parse(gachaMatch[1]);
  handleGachaResult(data);
} catch (error) {
  console.error('AI标签JSON解析失败:', error);
  toastr.error('AI回复格式错误，请重试');
  // 不移除原消息，让用户看到AI说了什么
  messageWasModified = false;
}
```

### 风险3：chat:received未触发
**问题**: 某些SillyTavern版本可能不支持此事件  
**应对**:
- 提供降级方案：纯手动模式（玩家点按钮抽卡）
- 检测API可用性：
```typescript
if (typeof SillyTavern?.Api?.Events?.on !== 'function') {
  console.warn('当前SillyTavern版本不支持AI交互，使用手动模式');
  useManualMode = true;
}
```

---

## 📈 性能优化

### 1. 批量同步MVU
```typescript
// 不要每次变动都同步，而是批量延迟同步
let syncTimer: NodeJS.Timeout | null = null;
const pendingUpdates = new Map();

function scheduleMVUSync(key: string, value: any) {
  pendingUpdates.set(key, value);
  
  if (syncTimer) clearTimeout(syncTimer);
  
  syncTimer = setTimeout(() => {
    // 批量执行
    for (const [k, v] of pendingUpdates.entries()) {
      SillyTavern.Api.command(`/setvar ${k} ${v}`, true);
    }
    pendingUpdates.clear();
  }, 500); // 500ms内的修改合并为一次同步
}
```

### 2. 标签解析缓存
```typescript
const tagParsers = new Map([
  ['gacha_result', /<gacha_result>(.*?)<\/gacha_result>/s],
  ['reward', /<reward>(.*?)<\/reward>/s],
  ['status', /<status>(.*?)<\/status>/s],
]);

// 避免重复创建正则对象
```

---

## 🧪 测试计划

### 单元测试
```typescript
describe('MVU Sync Module', () => {
  it('应该正确初始化羽石', async () => {
    const gems = await initFromMVU('gems');
    expect(gems).toBe(3000);
  });
  
  it('应该同步到localStorage和MVU', () => {
    syncToMVU('gems', 5000);
    expect(localStorage.getItem('gems')).toBe('5000');
    // Mock SillyTavern.Api.command 验证调用
  });
});

describe('AI Interceptor', () => {
  it('应该正确解析抽卡标签', () => {
    const message = '<gacha_result>{"cards":[{"name":"真乃","rarity":"SSR"}]}</gacha_result>';
    const result = parseGachaTag(message);
    expect(result.cards[0].name).toBe('真乃');
  });
  
  it('应该处理无效JSON', () => {
    const message = '<gacha_result>{invalid json}</gacha_result>';
    expect(() => parseGachaTag(message)).not.toThrow();
  });
});
```

### 集成测试
1. **刷新测试**: 刷新页面10次，数据一致性100%
2. **并发测试**: 多标签页同时抽卡，数据不冲突
3. **AI对话测试**: 连续10次AI抽卡，成功率>90%

---

## 📚 参考资料

### SillyTavern API文档
- `SillyTavern.Api.Events.on('chat:received')`
- `SillyTavern.Api.command(commandString, isSilent)`
- `evalTemplate(templateString)`

### 关键代码位置
- **MVU读写**: `@types/function/variables.d.ts`
- **事件监听**: `@types/iframe/exported.sillytavern.d.ts`
- **当前存储**: `src/偶像大师闪耀色彩/app.vue` Line 1240-1270

---

## 💡 未来扩展

### 扩展1：语音交互
- AI回复带`<voice>`标签
- 前端调用TTS播放角色语音

### 扩展2：多角色协同
- 多个偶像AI同时在线
- 通过MVU共享游戏状态

### 扩展3：社交功能
- 排行榜（MVU全局变量）
- 好友系统（跨角色卡数据共享）

---

## ✅ 验收标准

### Phase 2完成标准
- [ ] AI能感知玩家羽石数量
- [ ] AI能驱动抽卡流程
- [ ] 抽卡结果正确更新到localStorage和MVU
- [ ] 刷新页面数据不丢失
- [ ] AI生成标签的成功率>85%

### 最终完成标准
- [ ] 所有游戏数据双向同步
- [ ] AI可触发所有游戏事件
- [ ] 代码文档完整，后续可维护
- [ ] 性能无明显下降（<100ms延迟）

---

**企划负责人**: AI Assistant (Claude Sonnet 4.5)  
**参考来源**: Gemini对话记录  
**最后更新**: 2025-10-29


