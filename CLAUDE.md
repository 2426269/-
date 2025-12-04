# 偶像大师项目文档

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指导。

**🔴 重要规则：在本项目中工作时，始终使用中文进行交流和文档编写。**

## 项目概述

这是一个基于 SillyTavern 的偶像养成游戏项目，融合了《偶像大师 闪耀色彩》和《学园偶像大师》两作的核心机制。项目使用酒馆助手（Tavern Helper）框架构建，采用双层架构分离设计：

- **Vue 前端层**：负责游戏逻辑、UI 交互、状态管理（以 iframe 形式运行在 SillyTavern 消息楼层中）
- **SillyTavern 后端层**：负责 AI 叙事生成、角色对话、世界书管理

### 核心设计理念

1. **Token 优化策略**：游戏状态存储在 localStorage（0 tokens），仅在关键剧情节点调用 AI
2. **深度集成酒馆生态**：最大化利用酒馆助手、世界书、事件系统、MVU 变量框架等现有功能
3. **性能优先**：懒加载策略、最小化运行时开销、避免不必要的 AI 调用

---

## 酒馆助手框架基础

本项目主要用于编写酒馆助手 ([Tavern Helper](https://n0vi028.github.io/JS-Slash-Runner-Doc/guide/关于酒馆助手/介绍.html)) 所支持的前端界面或脚本。它们在酒馆 (SillyTavern) 中以前台或后台的形式运行，可以在代码中直接使用酒馆助手所提供的接口。

### 项目结构

每个前端界面或脚本，都以 `src` 文件夹中的一个独立文件夹形式存在：

- **前端界面项目**：文件夹中既有 `index.ts` 也有 `index.html`（例如 `src/界面示例`）
- **脚本项目**：文件夹中仅有 `index.ts`（例如 `src/脚本示例`）

初始模板位于：`模板/**/新建为src文件夹中的文件夹`

### 可用的第三方库

项目使用 **pnpm** 作为包管理器，在 `package.json` 的 `dependencies` 部分定义了可用的第三方库：

- **dedent**：处理模板字符串缩进
- **gsap**：制作动画效果（包括打字机效果）
- **jquery** 和 **jquery-ui**：DOM 操作和 UI 交互
- **lodash**：实用工具函数
- **pinia**：Vue 状态管理
- **pixi.js**：2D 渲染引擎
- **toastr**：通知提示
- **yaml**：YAML 解析
- **vue** 和 **vue-router**：前端框架和路由
- **@vueuse/core**：Vue 组合式 API 工具集
- **zod**：Schema 验证和数据校验

⚠️ **注意**：前端界面或脚本都是在浏览器中使用，因此不能使用 Node.js 库。

### 与酒馆交互的方式

#### 1. 酒馆助手接口

主要通过酒馆助手提供的接口与酒馆交互，这些接口定义在 `@types` 文件夹中：

- `@types/function/variables.d.ts`：操控酒馆变量
- `@types/iframe/exported.sillytavern.d.ts`：酒馆内置接口
- `@types/iframe/exported.mvu.d.ts`：MVU 变量框架接口

#### 2. STScript 命令

使用 `@types/function/slash.d.ts` 内的 `triggerSlash` 函数来调用 STScript 命令，具体命令列表见 `slash_command.txt` 文件。

⚠️ **重要**：以上接口在代码中均可直接使用，不需要导入或新定义，也不需要检查是否可用。

#### 3. 接口优先级

优先使用酒馆助手提供的接口，因为它们抽象层次更高，且更符合 TypeScript 的类型系统：

```typescript
// ✅ 推荐：使用酒馆助手接口
getChatMessages()
replaceWorldbook()
getIframeName()

// ❌ 避免：直接使用酒馆内置接口或 STScript 命令
SillyTavern.chat
triggerSlash('/setentryfield')
(this.frameElement as Element).id
```

### 特殊导入方式

#### 导入文件内容

```typescript
// 直接导入文件内容
import html_content from './html.html?raw';
import json_content from './json.json?raw';

// 经过 webpack 打包后导入（TypeScript → JavaScript，SCSS → CSS）
import javascript_content from './script.ts?raw';
import css_content from './style.scss?raw';
```

#### 导入 HTML

```typescript
// 通过 html-loader 将 HTML 最小化后作为字符串导入
import html from './文件.html';
```

#### 导入 Markdown

```typescript
// 通过 remark-loader 将 Markdown 解析为 HTML
import markdown from './文件.md';
```

#### 导入 Vue 组件

```typescript
// 直接导入 Vue 组件（优先使用）
import Component from './文件.vue';
```

#### 为前端界面导入样式

```typescript
// 在 TypeScript 中导入 SCSS，将自动打包到 <head> 部分
import './index.scss';
```

### 最佳实践

#### 1. 使用 TypeScript 而非 JavaScript

TypeScript 更容易写对，你应该使用 TypeScript 而非 JavaScript。

#### 2. 尽量使用第三方库

- 使用 **jQuery** 而不是原生 DOM 操作
- 使用 **jQuery UI** 实现拖动效果（Vue 中使用 VueUse）
- 使用 **Zod** 处理数据校验和纠错，用 `z.prettifyError()` 格式化错误信息
- 使用 **GSAP** 制作所有动画效果（打字机、过渡等）

示例（使用 Zod 进行数据校验）：

```typescript
const CardSchema = z.object({
  rarity: z.enum(['R', 'SR', 'SSR', 'UR']),
  // ...
});
const card = CardSchema.parse(data); // 自动验证和类型推断
```

#### 3. 优先使用 Vue 编写界面

Vue 相比于 jQuery 或 DOM 操作更为简单，应该尽量使用 Vue（可配合 Pinia、Vue Router）来编写前端界面。

⚠️ **注意**：
- `createRouter()` 不能写在 `$(() => {})` 中，必须在全局执行
- 由于界面运行在 iframe 中，应该使用 `history: createMemoryHistory()` 创建路由

**监听响应式数据变化并存入酒馆数据**：

```typescript
import { klona } from 'klona';

const Settings = z.object({/*...*/}); // 用 Zod 定义设置的类型和默认值
const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));

// 使用 klona() 去除 Proxy 层
watchEffect(() => replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() }));
```

#### 4. 正确在加载、卸载时执行功能

⚠️ **禁止使用 `DOMContentLoaded`**，因为界面可能通过网络链接加载到酒馆中，`DOMContentLoaded` 在这个加载过程中不会被触发。

**加载时执行**：

```typescript
$(() => {
  toastr.success('加载成功');
});
```

**卸载时执行**（使用 `'pagehide'` 而不是 `'unload'`）：

```typescript
$(window).on('pagehide', () => {
  toastr.success('卸载成功');
});
```

#### 5. 重载前端界面或脚本

如果有完全重载前端界面或脚本的需求，应该使用 `window.location.reload()`：

```typescript
let chat_id = SillyTavern.getCurrentChatId();
eventOn(tavern_events.CHAT_CHANGED, new_chat_id => {
  if (chat_id !== new_chat_id) {
    chat_id = new_chat_id;
    window.location.reload();
  }
});
```

---

## 酒馆变量系统

酒馆变量可用于持久化地存储前端界面、脚本的数据，可通过酒馆助手的 `getVariables`、`replaceVariables` 等接口读写。

### 5 种变量类型

1. **全局变量**：在酒馆中全局一致，无论是否打开角色卡、哪张角色卡，都共享同样的全局变量
2. **角色卡变量**：绑定在角色卡上的变量
3. **脚本变量**：绑定在某个脚本上的变量
4. **聊天变量**：绑定在某角色卡的某个聊天文件上的变量。当在酒馆中选择某张角色卡与 LLM 进行对话时，都需要创建一个聊天文件。
5. **消息楼层变量**：绑定在某角色卡、某聊天的某个楼层上。当在酒馆中用某个聊天文件与 LLM 进行对话时，可能会逐渐有很多用户输入和 AI 输出，每个用户输入和 AI 输出都是单独的消息楼层。

---

## 前端界面开发

前端界面以无沙盒 iframe 的形式在酒馆消息楼层中前台显示，有一个自己的界面。

### index.html 中应该写什么

前端界面的 `index.html` **仅可填写静态 `<body>` 内容**，不得引用项目中其他文件：

```html
<head>
  <!-- 保留一个什么都没有的 <head> 标签，webpack 打包时会在这里插入样式、脚本等 -->
</head>
<body>
  <!-- 这里写 <div>、<span> 等静态内容，也可以只写 <div id="app"></div> 交给 Vue 来渲染 -->
</body>
```

#### ❌ 禁止事项

- **禁止**在 `index.html` 中用 `<link rel="stylesheet" href="./index.css">` 导入样式
  - 应该在 Vue 组件中用 `<style lang="scss">` 书写
  - 或在 TypeScript 中用 `import './index.css'` 导入
- **禁止**在 `index.html` 中用 `<script src="./index.ts">` 引用脚本。`index.ts` 及它导入的文件会由 webpack 直接加入到最终打包好的 `dist/**/index.html` 中。
- **禁止**在 `<img>` 标签中使用 `src=""` 占位，否则会导致 webpack 打包错误

### 样式设计

#### 简单内嵌样式

对于简单的样式，可以在 `index.html` 中直接使用 Tailwind CSS 书写。为此需要新建一个内容有 `@import 'tailwindcss'` 的 CSS 文件并 `import ./文件.css`。

#### 复杂外链样式

如果样式复杂到需要使用 `<style>` 标签，则你不应该直接在 HTML 里书写 `<style>`，而应该：

1. **（优先）设计 Vue 组件**，并在 TypeScript 文件中 `import Component from './文件.vue'` 再将其 `mount` 到界面上
2. **或新建 SCSS 文件**并在 TypeScript 文件中以 `import './index.scss'` 的形式应用到界面上

### iframe 适配要求

- **禁止使用 `vh` 单位**等会受宿主高度影响的单位：使用 `width` 和 `aspect-ratio` 让高度根据宽度动态调整
- **避免强制撑高父容器**：避免使用 `min-height`、`overflow: auto`
- **页面整体应适配容器宽度**：不产生横向滚动条
- **如果样式更适合卡片形状**：则不要有背景颜色，除非用户有明确要求

---

## 脚本开发

脚本以无沙盒 iframe 的形式在酒馆后台运行，没有自己的界面，只有代码部分可供编写。

### jQuery 行为

脚本中的 jQuery **直接作用于整个酒馆页面**而非仅作用于脚本所在的 iframe：

```typescript
// ✅ 选择酒馆网页的 <body> 标签
$('body')

// ⚠️ 但 appendTo 等参数中的选择器依旧作用于脚本所在的 iframe，请小心使用
```

### 在脚本中使用 Vue

由于脚本运行在 iframe 中，当需要向酒馆页面挂载 Vue 组件时，应该使用 jQuery 创建挂载位置，将其添加到酒馆网页上，并使用 `app.mount($app[0])` 来挂载。

此外，vue-style-loader 会将样式注入到 iframe 的 `<head>` 中，为了使样式生效，你需要将样式复制到酒馆网页的 `<head>` 中：

```typescript
export function teleport_style() {
  $(`<div>`)
    .attr('script_id', getScriptId())
    .append($(`head > style`, document).clone())
    .appendTo('head');
}

export function deteleport_style() {
  $(`head > div[script_id="${getScriptId()}"]`).remove();
}
```

### 脚本设置

如果需要为用户提供自定义设置，可以使用脚本变量，并用 Zod 来定义设置的类型和默认值。

### 按钮事件

脚本可以在酒馆助手脚本库界面中设置按钮，用户点击按钮时将会触发对应的事件：

```typescript
eventOn(getButtonEvent('按钮名'), () => {
  console.log('按钮被点击了');
});
```

---

## MVU 变量框架

MVU 变量框架 ([MagVarUpdate](https://github.com/MagicalAstrogy/MagVarUpdate)) 是一个独立的酒馆助手脚本。它作用于消息楼层变量，允许酒馆角色卡作者：

- 在世界书中设置消息楼层变量
- 在世界书或聊天记录中初始化消息楼层变量
- 用 AI 输出更新消息楼层变量

`@types/iframe/exported.mvu.d.ts` 中定义了 MVU 变量框架的接口。如果提及到 "MVU 变量" 而非仅仅提及 "变量"，则应该优先使用 MVU 变量框架的接口。

### 使用方法

在使用 `Mvu` 变量之前，必须先等待初始化完成：

```typescript
await waitGlobalInitialized('Mvu');
```

### 数据存储

MVU 将变量数据存储在 `_.get(某楼层变量, 'stat_data')` 中：

```typescript
// 等价写法
_.get(getVariables({type: 'message', message_id: 5}), 'stat_data')
Mvu.getMvuData({type: 'message', message_id: 5})
```

此外，MVU 还会在变量中设置以下字段：

- `display_data`：变量变化的可视化表示，方便在前端显示变量变化
- `delta_data`：变量变化的增量数据

### 自行解析变量

当酒馆因用户输入或 AI 输出等而产生新消息楼层时，MVU 会自动解析消息字符串中的 MVU 命令，并根据它更新消息楼层变量。但通过 `generate` 等接口自行生成 AI 输出时，不会产生新消息楼层，因此不会自动解析 MVU 命令。

为此，MVU 提供了 `parseMessage` 接口用于自行解析包含 MVU 命令的消息字符串。它读取旧变量情况和一个消息字符串，得到更新后的变量结果。

为了更好的细粒度控制，解析不会将结果写回消息楼层。如果需要写回，则应执行 `replaceMvuData`：

```typescript
// 解析包含 MVU 命令的消息字符串
const result = Mvu.parseMessage(oldData, messageString);

// 手动写回（解析不会自动写回）
Mvu.replaceMvuData(result);
```

### 事件

除了 `getMvuData` 等接口外，MVU 还提供了一些事件，用于监听变量变化并在那时调整变量或执行其他功能。

---

## MCP 调试

你可以通过 browsermcp 自行读取酒馆网页当前的 DOM 情况、实际显示情况和 Console 情况。

---

## 开发环境

### 构建命令

#### 根目录（图像压缩）

```bash
# 安装依赖
pnpm install

# 压缩图像（使用 Sharp）
node compress-images.js

# 生成卡牌属性
node generate-card-attributes.js

# 分配卡牌稀有度
node assign-card-rarity.js
```

#### Vue 应用（tavern_helper_template）

```bash
cd tavern_helper_template

# 安装依赖
pnpm install

# 开发模式构建
pnpm run build:dev

# 生产模式构建
pnpm run build

# 监听模式（自动重新构建）
pnpm run watch

# 代码风格检查
pnpm run lint

# 自动修复代码风格问题
pnpm run lint:fix
```

### CI/CD 工作流

项目使用 GitHub Actions 自动构建和部署：

1. 推送到 `main` 分支时自动触发构建
2. 构建产物自动推送到 `gh-pages` 分支
3. 通过 jsdelivr CDN 访问：`https://cdn.jsdelivr.net/gh/{username}/{repo}@gh-pages/dist/{项目名}/index.html`

---

## 项目结构

```
E:\偶像大师\
├── tavern_helper_template/                # 酒馆助手模板项目（Vue 应用）
│   ├── src/                               # 源代码目录
│   │   ├── 偶像大师闪耀色彩-重构/           # 🔥 主要开发区域 - 所有系统集成在此
│   │   │   ├── 抽卡/                       # 抽卡系统（已重构）
│   │   │   ├── 战斗/                       # 卡牌战斗系统（核心开发中）
│   │   │   ├── 通信/                       # 与 SillyTavern 通信模块
│   │   │   ├── 世界书管理/                  # 世界书管理系统
│   │   │   ├── 音乐/                       # 音乐播放系统
│   │   │   ├── 图鉴/                       # 收藏/图鉴系统
│   │   │   └── [其他集成模块]/              # 培育、UI 组件等
│   │   ├── 偶像大师闪耀色彩-gacha/          # ⚠️ 旧版本 - 独立抽卡系统（已废弃，仅供参考）
│   │   ├── 偶像大师闪耀色彩-cardgame/       # ⚠️ 旧版本 - 独立战斗系统（已废弃，仅供参考）
│   │   ├── 界面示例/                       # 前端界面示例
│   │   ├── 脚本示例/                       # 脚本示例
│   │   └── common/                        # 公共工具
│   ├── @types/                            # TypeScript 类型定义
│   │   ├── function/                      # 酒馆助手函数接口
│   │   │   ├── variables.d.ts             # 变量操作接口
│   │   │   └── slash.d.ts                 # STScript 命令接口
│   │   └── iframe/                        # iframe 导出接口
│   │       ├── exported.sillytavern.d.ts  # 酒馆内置接口
│   │       └── exported.mvu.d.ts          # MVU 变量框架接口
│   ├── .cursor/                           # Cursor 规则文件夹
│   │   └── rules/
│   │       ├── 项目基本概念.mdc
│   │       ├── mcp.mdc
│   │       ├── 酒馆变量.mdc
│   │       ├── 前端界面.mdc
│   │       ├── 脚本.mdc
│   │       └── mvu变量框架.mdc
│   ├── 模板/                              # 项目模板
│   ├── 世界书/                            # 世界书数据（AI 提示词、设定）
│   ├── dist/                             # 构建输出目录
│   ├── package.json                      # 依赖配置
│   ├── webpack.config.js                 # Webpack 配置
│   └── README.md                         # 项目说明
│
├── 项目进度记录/                          # 设计文档
│   ├── 项目开发大纲-革新版.md             # 架构革新文档（1069 行）
│   ├── 游戏架构完整分析.md                # 架构详细说明
│   ├── 战斗系统实现方案.md                # 战斗系统设计
│   ├── AI交互增强系统_完整企划.md          # AI 集成计划
│   └── [其他设计文档]
│
├── 数据文件/
│   ├── 卡面库-最终版.json                 # 卡牌库（200 张闪耀色彩卡牌）
│   ├── 角色库-最终版.json                 # 角色库（28 位偶像）
│   ├── 学园偶像大师技能卡数据库.json       # 技能卡数据库（298 张学园卡牌）
│   └── db_names.json                     # 数据库名称映射
│
├── 资源目录/
│   ├── 闪耀色彩图片资源/                   # 原始图片资源
│   ├── 闪耀色彩图片-最终版/                # 处理后的图片资源
│   └── spine资源/                        # Spine 动画资源
│
├── 脚本/
│   ├── compress-images.js                # 图像压缩脚本
│   ├── generate-card-attributes.js       # 生成卡牌属性
│   ├── assign-card-rarity.js            # 分配稀有度
│   ├── *_fixer.py                       # Python Spine 资源管理
│   ├── *_check.py                       # Python 检查脚本
│   └── *.ps1                            # PowerShell 批处理脚本
│
├── 闪耀色彩卡牌机制说明.txt               # 游戏机制文档（685 行）
├── slash_command.txt                    # STScript 命令列表
├── package.json                         # 根目录依赖（Sharp）
└── CLAUDE.md                            # 本文件
```

---

## 核心架构

### 双层分离架构

```
┌─────────────────────────────────────────────────────────┐
│  Vue 前端层 (游戏逻辑)                                    │
│  - 100% 游戏逻辑（卡牌机制、计算、战斗规则）                │
│  - 100% UI 组件                                         │
│  - 100% 短期数据（localStorage 存储资源、抽卡数据、库存） │
│  - Token 消耗: 0 tokens                                 │
└─────────────────────────────────────────────────────────┘
                          ↕️ postMessage API
┌─────────────────────────────────────────────────────────┐
│  SillyTavern 后端层 (AI 叙事)                             │
│  - 100% AI 文本生成（故事、对话、卡牌技能描述）             │
│  - 100% 叙事变量（MVU 系统管理好感度、剧情标记、角色状态）  │
│  - AI 上下文管理（角色卡、聊天记忆、专用 Bot）              │
│  - Token 消耗: 仅在关键节点                               │
└─────────────────────────────────────────────────────────┘
```

### 数据存储策略

**localStorage（90% 的游戏数据）**：
- 资源：羽毛石（宝石）、粉丝数、制作人等级、制作人经验
- 卡牌库存和属性
- 抽卡历史和保底计数器
- 音乐播放器状态

**酒馆变量（仅 AI 相关数据）**：
- 每位偶像的好感度
- 当前剧情位置/时间
- 剧情进度标记
- 培育课程状态

**为什么这样分离？**：AI 不需要知道确切的宝石数量或卡牌列表。将它们保存在 localStorage 可以防止 Token 浪费并实现快速游戏操作。

### Token 优化策略

**问题**：传统 SillyTavern 聊天会在游戏状态上浪费 Token

```
用户："我训练了 Vocal"（50 tokens）
AI："你成功了，Vocal+10"（50 tokens）
... 30 回合后 = 3000+ tokens → AI 记忆崩溃
```

**解决方案**：Vue 处理所有游戏逻辑（0 tokens）
- 游戏状态存在 localStorage/Vue 内存中（对 AI 不可见）
- 仅在关键时刻调用 AI（培育完成、活动结束、终局）
- 每次 AI 调用获得：角色卡 + 单个场景上下文（<2000 tokens）

| 数据类型 | 存储位置 | Token 消耗 | 更新时机 |
|---------|---------|-----------|---------|
| 游戏状态 | localStorage | 0 | 每次操作 |
| 偶像属性 | localStorage | 0 | 每次操作 |
| 卡组配置 | localStorage | 0 | 每次操作 |
| 关键剧情 | SillyTavern 消息 | ~1000 | 剧情节点 |
| AI 对话 | SillyTavern 消息 | ~500 | 用户主动触发 |

### 性能优化策略

#### 1. 懒加载策略

- ❌ **错误**：启动时加载全部 300 张图片 → 浏览器冻结
- ✅ **正确**：加载 1 个背景、1 个角色精灵、最小 UI → 即时启动
- ✅ **音乐**：仅加载元数据，播放时流式传输 MP3
- ✅ **抽卡**：仅在抽卡模态框打开时加载 UI 资源

#### 2. 代码分割

- ❌ **错误**：在 TS 中硬编码 298 个卡牌描述 → 5MB 打包体积
- ✅ **正确**：存储在 `skill-cards.json` 中，异步获取 → <500KB 打包体积

#### 3. 最小化运行时开销

- 避免不必要的响应式数据
- 使用 `klona()` 去除 Proxy 层后存储
- 合理使用 `watchEffect` 和 `computed`

---

## 游戏系统

⚠️ **重要说明**：所有系统当前都在 `src/偶像大师闪耀色彩-重构/` 中集成开发。旧版本的 `gacha/` 和 `cardgame/` 文件夹已废弃，仅供参考。

### 1. 抽卡系统 (✅ 已重构)

**主要位置**：`src/偶像大师闪耀色彩-重构/抽卡/`
**旧版本参考**：`src/偶像大师闪耀色彩-gacha/`（已废弃）

**实现状态**：已在重构版本中集成

**核心功能**：
- 单抽/10 连抽，概率系统（UR 0.5%、SSR 5%、SR 16%、R 78.5%）
- 保底机制（90 抽必出 SSR，200 抽必出 UR）
- 重复卡牌转换为星尘
- 200 张闪耀色彩真实卡牌数据
- 卡池管理和特色卡牌

### 2. 卡牌战斗系统 (⚠️ 核心开发中)

**主要位置**：`src/偶像大师闪耀色彩-重构/战斗/`
**旧版本参考**：`src/偶像大师闪耀色彩-cardgame/`（已废弃）

**实现状态**：在重构版本中进行核心开发，需要完善集成和平衡性调整

**游戏机制**（来自学园偶像大师）：
- 基于卡牌的培育系统，资源管理（元気/体力/stamina）
- 3 种培育计划：感性（Sense）、理性（Logic）、非凡（Anomaly）
- Buff/Debuff 系统，支持叠加效果
- 技能卡具有消耗、效果和稀有度（N/R/SR/SSR）

**关键约束**：
- ⚠️ **技能卡永远不直接修改 Vocal/Dance/Visual 三维属性**
- 技能卡只提供属性（如 Cost、Stat_Buff）和 Buff 效果
- 三维提升通过 Lesson（课程）系统实现

### 3. 音乐系统 (✅ 已集成)

**主要位置**：`src/偶像大师闪耀色彩-重构/音乐/`

**实现状态**：已在重构版本中集成

**核心功能**：
- 194 首闪耀色彩歌曲（独唱/组合/全员）
- 播放控制，支持循环/随机模式
- 同步歌词显示（日语 + 中文）
- 专辑封面
- 通过 localStorage 跨标签页同步

### 4. 通信系统 (🔄 开发中)

**主要位置**：`src/偶像大师闪耀色彩-重构/通信/`

**实现状态**：框架已搭建，正在完善与 SillyTavern 的集成

**核心功能**：
- postMessage API 通信
- 事件监听和分发
- 酒馆变量同步
- AI 调用接口封装

### 5. 世界书管理系统 (🔄 开发中)

**主要位置**：`src/偶像大师闪耀色彩-重构/世界书管理/`

**实现状态**：基础框架完成，内容生产中

**核心功能**：
- 世界书条目管理
- 角色设定和 AI 引导
- 剧情触发条件
- 动态上下文注入

### 6. 图鉴系统 (🔄 开发中)

**主要位置**：`src/偶像大师闪耀色彩-重构/图鉴/`

**实现状态**：规划中

**计划功能**：
- 卡牌收藏图鉴
- 偶像资料查看
- 成就系统
- 收集进度统计

### 7. P-Produce 培育系统 (❌ 待开发)

**计划位置**：`src/偶像大师闪耀色彩-重构/培育/`（待创建）

**计划功能**：
- 回合制培育，持续 13-30 回合（取决于剧本）
- 每回合 3 种行动：Training（卡牌战斗）、Free Activity（地图）、Rest（休息）
- 每次行动后 AI 生成剧情场景
- 属性成长（Vocal/Dance/Visual）
- 最终比赛和排名

**学园偶像大师的培育计划**：
- **感性（Sense）**：积累好調（良好状态）和集中（专注）以实现爆发得分
- **理性（Logic）**：积累好印象（好印象）和やる気（干劲）以实现稳定进步
- **非凡（Anomaly）**：使用三种指针状态（全力/坚决/温存）实现灵活战术

### 所有系统的集成架构

**重构版本的优势**：
1. **统一入口**：所有系统通过统一的路由和状态管理集成
2. **模块化设计**：每个子系统独立开发，通过接口通信
3. **共享资源**：公共组件、工具函数、类型定义统一管理
4. **易于维护**：避免了旧版本中的代码重复和耦合问题

---

## AI 集成

**主要位置**：`src/偶像大师闪耀色彩-重构/通信/` 和 `世界书管理/`

**通信系统**：
- 监听 SillyTavern 消息的事件监听器
- 用于状态管理的酒馆变量 API
- 用于角色设定和 AI 引导的世界书

**AI 使用场景**：
1. **培育叙事**：基于结果的培育后短故事
2. **自由活动故事**：基于位置的互动，包含好感度系统
3. **技能卡生成**：使用专用 Bot 为每张卡生成独特技能
4. **结局故事**：基于最终排名的 200 字结局

**重要**：AI 应该永远不直接修改 Vocal/Dance/Visual 属性。卡牌提供 Buff 和属性（元気、干劲、专注等），然后通过乘数影响培育/比赛分数。

---

## 数据规范

### 卡牌稀有度

| 稀有度 | 代号 | 概率 | 说明 |
|-------|------|------|------|
| UR | ur | 0.5% | 最高稀有度 |
| SSR | ssr | 5% | 超高稀有度 |
| SR | sr | 16% | 高稀有度 |
| R | r | 78.5% | 基础稀有度 |

### 卡牌属性

**文件**：卡牌数据使用罗马化名称作为文件路径
- 示例：`樱木真乃` → `mano_sakuragi`
- `card-attributes.json` 中的属性结构：

```typescript
{
  characterId: string,        // 罗马化 ID
  characterName: string,      // 日语名称
  theme: string,             // 卡牌主题
  rarity: 'R' | 'SR' | 'SSR' | 'UR',
  attribute: 'Vocal' | 'Dance' | 'Visual',
  produceplan: '感性' | '理性' | '非凡'
}
```

### 技能卡

**数据库**：`学园偶像大师技能卡数据库.json`（298 张卡牌）

**重要约束**：
- 技能卡**永远不直接增加** Vocal/Dance/Visual 属性
- 它们提供：属性（元気、干劲、专注、集中、活力、全力值）、Buff（好調、集中、好印象）和特殊效果
- Vocal/Dance/Visual 属性设置比赛回合分布，并作为分数乘数
- 卡牌效果必须遵循基于稀有度的力量缩放（R=简单，SR=2-3 个效果，SSR=复杂组合）

```typescript
// ❌ 错误示例：技能卡直接修改三维
skillCard.stat_buff = { vocal: 100 };  // 禁止！

// ✅ 正确示例：技能卡提供 Buff，由 Lesson 系统修改三维
skillCard.stat_buff = { lesson_efficiency: 1.5 };  // 提升课程效率
idol.vocal += lessonResult * buffMultiplier;       // 课程系统修改三维
```

### 三大培育计划

| 培育计划 | 英文代号 | 核心属性 | 说明 |
|---------|---------|---------|------|
| 感性 | Sense | Vocal (歌唱) | 侧重情感表达和歌唱能力 |
| 理性 | Logic | Dance (舞蹈) | 侧重技巧和舞蹈能力 |
| 非凡 | Anomaly | Visual (表现) | 侧重个性和舞台表现力 |

### 图像资源

**CDN**：GitHub Release 通过 jsDelivr 作为免费 CDN
- 卡牌图片：使用 Sharp 压缩至 <500KB
- 背景和 UI 元素：按需懒加载
- Spine 动画：需要时流式传输

---

## iframe 兼容性

### 路由器配置

```typescript
// 必须使用 memory history 进行 iframe 路由
const router = createRouter({
  history: createMemoryHistory(),
  routes: [...]
});
```

### 生命周期钩子

```typescript
// 使用 jQuery 而不是 DOMContentLoaded（远程加载时不会触发）
$(() => {
  // 初始化应用
});

// 使用 pagehide 而不是 unload 进行清理
$(window).on('pagehide', () => {
  // 清理
});
```

### 样式

- 避免 `vh` 单位（受父容器高度影响）
- 使用 `width` + `aspect-ratio` 实现响应式高度
- 避免 `overflow: auto` 强制父容器扩展

---

## TypeScript 最佳实践

### 使用酒馆助手 API

**在 `@types/` 中定义**：

```typescript
// ✅ 推荐
getVariables()
replaceVariables()
eventOn(tavern_events.*)
triggerSlash()

// ❌ 避免
// 使用原生 SillyTavern API 或 jQuery hack
```

### 使用 Zod 进行 Schema 验证

```typescript
const CardSchema = z.object({
  rarity: z.enum(['R', 'SR', 'SSR', 'UR']),
  // ...
});
const card = CardSchema.parse(data); // 自动验证和类型推断
```

### Vue 响应式状态与酒馆同步

```typescript
import { klona } from 'klona';

const settings = ref(SettingsSchema.parse(getVariables({...})));

// 保存到酒馆变量之前移除 Proxy
watchEffect(() =>
  replaceVariables(klona(settings.value), {...})
);
```

---

## 常见开发任务

### 添加新脚本（后台进程）

1. 创建 `src/新脚本/index.ts`（无 HTML 文件）
2. 使用酒馆助手 API 实现
3. 使用 `eventOn()` 进行后台事件监听
4. 对于 UI 注入：创建 Vue 应用，挂载到 `$('<div>').appendTo('body')`

### 添加新 UI 界面

1. 创建文件夹，包含 `src/新界面/index.ts` + `index.html`
2. 使用 Vue 组件设计（推荐）或原生 HTML
3. 在 TS 中通过 `import './index.scss'` 导入样式
4. 构建生成独立的 `dist/新界面/index.html`

### 本地测试

1. 在 `tavern_helper_template/` 中运行 `pnpm run watch`
2. 通过酒馆助手在 SillyTavern 中加载生成的 `dist/*/index.html`
3. 使用浏览器 DevTools（iframe 上下文）进行调试

### 更新第三方依赖

```bash
cd tavern_helper_template
pnpm add <package>        # 添加新依赖
pnpm update              # 更新所有依赖
```

---

## 已知问题和技术债务

1. **无 iframe 通信层**：尚无法与 SillyTavern AI 交互
2. **无 MVU 集成**：叙事变量不持久化
3. **卡牌战斗未完成**：核心机制已实现，UI 集成待完成
4. **培育系统缺失**：P-Produce 框架尚未开始

---

## 开发路线图

### 阶段 1：基础设施（60% 完成）

- [x] 主页面 UI
- [x] 抽卡系统
- [x] 音乐系统
- [x] localStorage 持久化
- [ ] iframe 通信系统（**关键下一步**）

### 阶段 2：核心玩法

- [ ] 卡牌战斗系统集成
- [ ] P-Produce 培育框架
- [ ] 回合制系统
- [ ] 数值平衡

### 阶段 3：AI 叙事

- [ ] postMessage 通信
- [ ] AI 故事生成（培育/活动/结局）
- [ ] MVU 变量同步
- [ ] 卡牌生成专用 Bot

### 阶段 4：内容

- [ ] 带模块化位置的自由活动地图
- [ ] 多个剧本（WING、Thanksgiving、GRAD）
- [ ] 好感度故事系统
- [ ] AI 卡牌生成与加载屏幕

### 阶段 5：优化

- [ ] 性能优化（懒加载）
- [ ] UI/UX 优化
- [ ] 错误处理
- [ ] 用户引导

---

## 参考文档

### 核心设计文档

1. **项目开发大纲-革新版.md**（1069 行）
   - 架构革新的核心思想
   - 从旧架构到新架构的转变
   - 深度集成酒馆助手生态

2. **游戏架构完整分析.md**
   - 双层分离架构详细说明
   - Token 优化策略详解
   - 各系统实现状态和优先级

3. **闪耀色彩卡牌机制说明.txt**（685 行）
   - 完整游戏机制说明
   - 298 张技能卡数据库统计
   - 三大培育计划的详细机制
   - **技能卡不直接提升三维的约束说明**

4. **战斗系统实现方案.md**
   - 战斗系统设计

5. **AI交互增强系统_完整企划.md**
   - AI 集成计划

### 酒馆助手文档

- [Tavern Helper 官方文档](https://n0vi028.github.io/JS-Slash-Runner-Doc/guide/关于酒馆助手/介绍.html)
- [MVU 变量框架 GitHub](https://github.com/MagicalAstrogy/MagVarUpdate)

### 技术栈文档

- [Vue 3 官方文档](https://vuejs.org/)
- [Pinia 状态管理](https://pinia.vuejs.org/)
- [GSAP 动画库](https://greensock.com/gsap/)
- [PixiJS 渲染引擎](https://pixijs.com/)
- [Zod Schema 验证](https://zod.dev/)

---

## 常见问题

### Q: 如何新建一个前端界面项目？

A: 在 `tavern_helper_template/src/` 下新建文件夹，创建 `index.ts` 和 `index.html`。

### Q: 如何新建一个脚本项目？

A: 在 `tavern_helper_template/src/` 下新建文件夹，创建 `index.ts`。

### Q: 为什么技能卡不能直接修改 Vocal/Dance/Visual？

A: 为了保持游戏平衡性和分离战斗系统与培育系统，技能卡只提供 Buff 效果，三维属性通过 Lesson（课程）系统提升。

### Q: 如何调试前端界面或脚本？

A: 使用 browsermcp 工具读取酒馆网页的 DOM、Console 和实际显示情况。

### Q: 如何添加新的第三方库？

A: 在 `tavern_helper_template/` 目录下运行 `pnpm add <包名>`。

### Q: 为什么要使用 klona() 去除 Proxy 层？

A: 当需要将 Vue 的响应式数据存入酒馆变量时，需要先用 `klona()` 去除 Proxy 层，否则会导致数据存储错误。

### Q: 为什么禁止使用 DOMContentLoaded？

A: 因为界面可能通过 `$('body').load(网络链接)` 或 `import '网络链接'` 的方式加载到酒馆中，`DOMContentLoaded` 在这个加载过程中不会被触发。

---

## 结语

本项目是一个长期开发的复杂项目，涉及 Vue 3、TypeScript、SillyTavern、酒馆助手等多种技术栈。在开发过程中：

1. **始终使用中文**进行交流和文档编写
2. **遵循项目规范**和最佳实践
3. **优先使用酒馆助手接口**而非直接操作酒馆
4. **注意性能和 Token 优化**
5. **遵守技能卡约束**（不直接修改三维属性）
6. **使用 TypeScript**而非 JavaScript
7. **优先使用 Vue**编写界面
8. **使用 Zod**进行数据校验
9. **使用 GSAP**制作动画效果
10. **使用懒加载策略**优化性能

如有疑问，请参考本文件中的相关章节或查阅项目进度记录中的详细设计文档。
