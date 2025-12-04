# MVU变量集成 - 技术实施指南

## 📖 文档目的

本文档提供**MVU ({{v::变量}}) 集成**的详细技术实现方案，包含完整代码示例、最佳实践和常见问题解决方案。

**前置阅读**: `AI交互增强系统_完整企划.md`

---

## 🎯 核心概念

### MVU变量是什么？
MVU (Model-View-Update) 变量是SillyTavern的**酒馆助手插件**提供的持久化变量系统。

**特点**:
- ✅ 存储在SillyTavern服务端
- ✅ AI可通过`{{v::变量名}}`读取
- ✅ 跨聊天文件持久化
- ✅ 支持字符串、数字、JSON

**与localStorage的区别**:
| 特性       | localStorage   | MVU变量                 |
| ---------- | -------------- | ----------------------- |
| 存储位置   | 浏览器本地     | SillyTavern服务端       |
| AI可见性   | ❌ AI完全看不到 | ✅ AI可读取              |
| 即时性     | ⚡ 立即         | 🐌 需要命令执行          |
| 刷新持久化 | ✅              | ✅                       |
| 跨设备     | ❌              | ✅ (如果SillyTavern同步) |

**最佳实践**: **双存储策略**
```
用户操作 → localStorage（即时显示） → MVU（后台同步） → AI可读取
```

---

## 🔧 酒馆助手API参考

### 1. 读取MVU变量

#### 方法1：使用 `getVariables()`
```typescript
// 从 @types/function/variables.d.ts
declare function getVariables(options: {
  type: 'global' | 'script' | 'chat' | 'character' | 'message';
  script_id?: string;
  chat_id?: string;
  character_id?: string;
  message_id?: number;
}): Record<string, any>;

// 示例：读取全局变量
const globalVars = getVariables({ type: 'global' });
const gems = globalVars['gems'] || 3000;
```

#### 方法2：使用 `evalTemplate()` (SillyTavern原生)
```typescript
// 解析模板字符串
const gems = await evalTemplate('{{v::gems}}');
// 注意：如果变量不存在，返回字符串 "{{v::gems}}"

// 安全解析示例
async function getMVUVariable(key: string, defaultValue: any): Promise<any> {
  const result = await evalTemplate(`{{v::${key}}}`);
  
  // 如果变量不存在，返回的是模板字符串本身
  if (result === `{{v::${key}}}`) {
    return defaultValue;
  }
  
  // 尝试解析为数字
  const num = Number(result);
  if (!isNaN(num)) return num;
  
  // 尝试解析为JSON
  try {
    return JSON.parse(result);
  } catch {
    return result; // 返回原始字符串
  }
}
```

### 2. 写入MVU变量

#### 方法1：使用 `replaceVariables()`
```typescript
// 从 @types/function/variables.d.ts
declare function replaceVariables(
  variables: Record<string, any>,
  options: {
    type: 'global' | 'script' | 'chat' | 'character' | 'message';
    script_id?: string;
    chat_id?: string;
    character_id?: string;
    message_id?: number;
  }
): void;

// 示例：写入全局变量
replaceVariables(
  { 
    gems: 5000,
    producerLevel: 10,
    ownedIdols: JSON.stringify(['樱木真乃', '风野灯织'])
  },
  { type: 'global' }
);
```

#### 方法2：使用 `/setvar` 命令
```typescript
// 使用SillyTavern的命令系统
SillyTavern.Api.command('/setvar gems 5000', true); // true = silent模式
```

**推荐**: 使用 `replaceVariables()`，更符合TypeScript类型系统。

---

## 📦 模块设计

### 文件结构
```
src/偶像大师闪耀色彩/
├── mvu-sync.ts          # MVU同步模块（新建）
├── app.vue              # 主组件（修改）
└── constants.ts         # 常量定义（修改）
```

---

### `mvu-sync.ts` - 完整实现

```typescript
/**
 * MVU变量同步模块
 * 负责localStorage和酒馆助手MVU变量的双向同步
 */

import { toastr } from '@types/iframe/exported.toastr';

// ============================================================================
// 类型定义
// ============================================================================

/** MVU变量类型 */
export type MVUVariableType = 'global' | 'script' | 'chat' | 'character';

/** 同步配置 */
export interface SyncConfig {
  type: MVUVariableType;
  script_id?: string;
  chat_id?: string;
  character_id?: string;
}

/** 变量映射：localStorage键名 <-> MVU键名 */
export interface VariableMapping {
  localKey: string;     // localStorage中的键名
  mvuKey: string;       // MVU中的键名
  defaultValue: any;    // 默认值
  serialize?: (val: any) => string;   // 序列化函数（存入MVU）
  deserialize?: (val: string) => any; // 反序列化函数（从MVU读取）
}

// ============================================================================
// 变量映射配置
// ============================================================================

/** 需要同步的变量列表 */
export const VARIABLE_MAPPINGS: VariableMapping[] = [
  {
    localKey: 'shinycolors_resources',
    mvuKey: 'resources',
    defaultValue: {
      featherStones: 3000,
      fans: 0,
      producerLevel: 1,
      producerExp: 0,
    },
    serialize: (val) => JSON.stringify(val),
    deserialize: (val) => JSON.parse(val),
  },
  {
    localKey: 'shinycolors_gacha_data',
    mvuKey: 'gachaData',
    defaultValue: {
      stardust: 0,
      ownedCards: {},
      pity: {
        totalPulls: 0,
        ssrPity: 0,
        urPity: 0,
      },
      history: [],
    },
    serialize: (val) => JSON.stringify(val),
    deserialize: (val) => JSON.parse(val),
  },
];

// ============================================================================
// 核心功能
// ============================================================================

/**
 * 从MVU初始化所有变量到localStorage
 * 优先使用MVU数据，如果不存在则使用默认值
 */
export async function initializeFromMVU(config: SyncConfig = { type: 'global' }): Promise<void> {
  console.log('🔄 开始从MVU初始化变量...');
  
  try {
    // 读取所有MVU变量
    const mvuVars = getVariables(config);
    
    // 遍历映射表
    for (const mapping of VARIABLE_MAPPINGS) {
      const mvuValue = mvuVars[mapping.mvuKey];
      
      if (mvuValue !== undefined && mvuValue !== null) {
        // MVU中有数据，使用它
        try {
          const deserializedValue = mapping.deserialize
            ? mapping.deserialize(mvuValue)
            : mvuValue;
          
          localStorage.setItem(
            mapping.localKey,
            typeof deserializedValue === 'string'
              ? deserializedValue
              : JSON.stringify(deserializedValue)
          );
          
          console.log(`✅ 从MVU读取 ${mapping.mvuKey}:`, deserializedValue);
        } catch (error) {
          console.error(`❌ 反序列化 ${mapping.mvuKey} 失败:`, error);
          // 使用默认值
          localStorage.setItem(mapping.localKey, JSON.stringify(mapping.defaultValue));
        }
      } else {
        // MVU中没有数据，使用默认值并同步到MVU
        localStorage.setItem(mapping.localKey, JSON.stringify(mapping.defaultValue));
        
        // 首次初始化：将默认值写入MVU
        await syncToMVU(mapping.localKey, mapping.defaultValue, config);
        
        console.log(`🆕 首次初始化 ${mapping.mvuKey}:`, mapping.defaultValue);
      }
    }
    
    toastr.success('数据同步完成！', '', { timeOut: 1500 });
  } catch (error) {
    console.error('❌ MVU初始化失败:', error);
    toastr.warning('使用本地数据', '无法连接服务器', { timeOut: 2000 });
    
    // 降级：使用默认值
    for (const mapping of VARIABLE_MAPPINGS) {
      const existing = localStorage.getItem(mapping.localKey);
      if (!existing) {
        localStorage.setItem(mapping.localKey, JSON.stringify(mapping.defaultValue));
      }
    }
  }
}

/**
 * 将localStorage中的值同步到MVU
 */
export async function syncToMVU(
  localKey: string,
  value: any,
  config: SyncConfig = { type: 'global' }
): Promise<void> {
  // 查找映射
  const mapping = VARIABLE_MAPPINGS.find(m => m.localKey === localKey);
  if (!mapping) {
    console.warn(`⚠️ 未找到 ${localKey} 的MVU映射`);
    return;
  }
  
  try {
    // 序列化
    const serializedValue = mapping.serialize
      ? mapping.serialize(value)
      : String(value);
    
    // 写入MVU
    replaceVariables({ [mapping.mvuKey]: serializedValue }, config);
    
    console.log(`✅ 同步到MVU ${mapping.mvuKey}:`, value);
  } catch (error) {
    console.error(`❌ 同步到MVU失败 (${mapping.mvuKey}):`, error);
  }
}

/**
 * 批量延迟同步（性能优化）
 */
let syncTimer: NodeJS.Timeout | null = null;
const pendingSyncs = new Map<string, any>();

export function scheduleSyncToMVU(
  localKey: string,
  value: any,
  config: SyncConfig = { type: 'global' },
  delay: number = 500
): void {
  // 记录待同步的值
  pendingSyncs.set(localKey, value);
  
  // 清除旧定时器
  if (syncTimer) clearTimeout(syncTimer);
  
  // 设置新定时器
  syncTimer = setTimeout(async () => {
    console.log(`🔄 批量同步 ${pendingSyncs.size} 个变量到MVU...`);
    
    // 批量同步
    for (const [key, val] of pendingSyncs.entries()) {
      await syncToMVU(key, val, config);
    }
    
    pendingSyncs.clear();
  }, delay);
}

/**
 * 从MVU读取单个变量
 */
export function getFromMVU<T = any>(
  localKey: string,
  config: SyncConfig = { type: 'global' }
): T | null {
  const mapping = VARIABLE_MAPPINGS.find(m => m.localKey === localKey);
  if (!mapping) return null;
  
  try {
    const mvuVars = getVariables(config);
    const mvuValue = mvuVars[mapping.mvuKey];
    
    if (mvuValue === undefined || mvuValue === null) {
      return null;
    }
    
    return mapping.deserialize
      ? mapping.deserialize(mvuValue)
      : mvuValue;
  } catch (error) {
    console.error(`❌ 从MVU读取 ${mapping.mvuKey} 失败:`, error);
    return null;
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 检查酒馆助手是否可用
 */
export function isMVUAvailable(): boolean {
  return (
    typeof getVariables === 'function' &&
    typeof replaceVariables === 'function'
  );
}

/**
 * 清空所有MVU变量（危险操作，仅用于重置）
 */
export function clearAllMVU(config: SyncConfig = { type: 'global' }): void {
  if (!confirm('确定要清空所有MVU变量吗？此操作不可逆！')) {
    return;
  }
  
  const clearData: Record<string, any> = {};
  for (const mapping of VARIABLE_MAPPINGS) {
    clearData[mapping.mvuKey] = null;
  }
  
  replaceVariables(clearData, config);
  toastr.success('MVU变量已清空！');
}
```

---

### `app.vue` - 集成示例

```typescript
// 在 <script setup> 顶部导入
import { initializeFromMVU, scheduleSyncToMVU, isMVUAvailable } from './mvu-sync';

// 修改资源加载逻辑
const loadResources = () => {
  try {
    const saved = localStorage.getItem('shinycolors_resources');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('读取资源数据失败:', error);
  }
  // 默认值（会在initializeFromMVU中被MVU数据覆盖）
  return {
    featherStones: 999999999, // 测试用
    fans: 0,
    producerLevel: 1,
    producerExp: 0,
  };
};

const resources = reactive(loadResources());

// 监听资源变化，自动保存到localStorage和MVU
watch(
  resources,
  (newValue) => {
    try {
      // 1. 立即保存到localStorage（即时响应）
      localStorage.setItem('shinycolors_resources', JSON.stringify(newValue));
      
      // 2. 延迟批量同步到MVU（避免频繁IO）
      if (isMVUAvailable()) {
        scheduleSyncToMVU('shinycolors_resources', newValue);
      }
    } catch (error) {
      console.error('保存资源数据失败:', error);
    }
  },
  { deep: true }
);

// 在 onMounted 中初始化
onMounted(async () => {
  loadProducerName();
  loadSettings();
  
  // ===== 关键：从MVU初始化数据 =====
  if (isMVUAvailable()) {
    await initializeFromMVU({ type: 'global' });
    
    // 重新加载localStorage数据（已被MVU数据更新）
    const updatedResources = loadResources();
    Object.assign(resources, updatedResources);
    
    console.log('✅ 已从MVU初始化资源:', resources);
  } else {
    console.warn('⚠️ 酒馆助手不可用，使用本地数据');
  }
  
  // ... 其他初始化代码
});
```

---

## 🧪 测试方案

### 1. 控制台测试
```javascript
// 在浏览器控制台执行

// 测试1：读取MVU变量
getVariables({ type: 'global' });
// 应该看到: { resources: "{...}", gachaData: "{...}" }

// 测试2：写入MVU变量
replaceVariables({ testVar: 'Hello MVU!' }, { type: 'global' });

// 测试3：在AI中读取
// 在聊天框发送: {{v::testVar}}
// AI应该能看到: "Hello MVU!"

// 测试4：清空localStorage并刷新
localStorage.clear();
location.reload();
// 数据应该从MVU恢复
```

### 2. AI提示词测试
```yaml
# 在System Prompt中添加：
当前羽石数量: {{v::resources}}
请将这个JSON解析后告诉我羽石有多少。
```

预期AI回复：
```
制作人，你现在有 999999999 个羽石呢！
```

---

## ⚠️ 常见问题

### Q1: `getVariables is not defined`
**原因**: 酒馆助手插件未启用或版本过旧  
**解决**:
1. 打开SillyTavern → Extensions → 确保"Quick Replies"扩展已启用
2. 更新SillyTavern到最新版本
3. 代码中添加检查：
```typescript
if (typeof getVariables !== 'function') {
  console.warn('酒馆助手不可用，使用降级方案');
  // 只使用localStorage
}
```

### Q2: MVU变量在AI中显示为空
**原因**: 变量类型不匹配（global vs chat）  
**解决**: 确保读写使用相同的type
```typescript
// 写入
replaceVariables({ gems: 5000 }, { type: 'global' });

// 读取（AI提示词中）
{{v::gems}}  // ✅ 自动读取global类型

// 如果需要chat类型：
{{cv::gems}} // chat变量
```

### Q3: 数据同步延迟
**原因**: 批量同步的延迟（500ms）  
**解决**: 对关键操作使用立即同步
```typescript
// 抽卡后立即同步（不使用批量）
await syncToMVU('shinycolors_resources', resources);
```

### Q4: JSON序列化错误
**原因**: 数据中包含不可序列化的内容（如函数、Proxy）  
**解决**: 使用`klona`去除Proxy层
```typescript
import { klona } from 'klona';

// 在watch中
watch(resources, (newValue) => {
  const plain = klona(newValue); // 去除Vue的响应式Proxy
  scheduleSyncToMVU('shinycolors_resources', plain);
});
```

---

## 🎯 最佳实践总结

### ✅ DO（推荐）
- 使用双存储策略（localStorage + MVU）
- localStorage作为主存储，MVU作为备份
- 批量延迟同步MVU（避免频繁IO）
- 关键操作（抽卡、购买）后立即同步
- 始终提供降级方案（MVU不可用时）

### ❌ DON'T（避免）
- 不要频繁读写MVU（性能差）
- 不要将MVU作为唯一存储（可能不可用）
- 不要存储大量数据到MVU（有限制）
- 不要直接存储Vue响应式对象（需klona）

---

## 📊 性能指标

| 操作       | localStorage | MVU    | 建议                   |
| ---------- | ------------ | ------ | ---------------------- |
| 读取       | <1ms         | ~10ms  | 优先localStorage       |
| 写入       | <1ms         | ~20ms  | 批量延迟同步MVU        |
| 初始化     | 立即         | ~100ms | 启动时从MVU读取一次    |
| 数据量限制 | ~5MB         | ~1MB   | 大数据优先localStorage |

---

**文档版本**: 1.0  
**最后更新**: 2025-10-29  
**维护者**: AI Assistant (Claude Sonnet 4.5)


