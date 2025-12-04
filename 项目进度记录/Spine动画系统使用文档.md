# Spine动画系统使用文档

**版本**: v1.0  
**日期**: 2025-11-06  
**状态**: 🟢 开发中

---

## 📋 目录

1. [系统概览](#系统概览)
2. [快速开始](#快速开始)
3. [组件使用](#组件使用)
4. [脚本系统](#脚本系统)
5. [API参考](#api参考)
6. [自定义扩展](#自定义扩展)
7. [常见问题](#常见问题)

---

## 系统概览

### 架构设计

```
┌─────────────────────────────────────────────────────┐
│                   酒馆助手环境                        │
│  ┌──────────────────────────────────────────────┐  │
│  │          后台脚本 (spine-controller)          │  │
│  │  - 监听AI消息                                 │  │
│  │  - 情感检测                                   │  │
│  │  - 发送动画指令                               │  │
│  └────────────┬─────────────────────────────────┘  │
│               │ postMessage                          │
│               ↓                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │    前端界面 (Spine展示.vue - iframe)          │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │   Spine播放器.vue                       │  │  │
│  │  │   - PixiJS + Spine渲染                 │  │  │
│  │  │   - 动画管理器                         │  │  │
│  │  │   - 资源加载                           │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │   Spine交互层.vue                       │  │  │
│  │  │   - 点击检测                           │  │  │
│  │  │   - 交互反馈                           │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 核心特性

- ✅ **自动情感检测**: 根据AI消息内容自动播放对应动画
- ✅ **手动标签控制**: 支持 `<emotion>` 标签精确指定动画
- ✅ **交互反馈**: 点击角色不同部位触发相应动画
- ✅ **动画队列管理**: 智能管理多个动画的播放顺序
- ✅ **说话动画**: AI生成消息时自动播放说话动画
- ✅ **背景切换**: 自动或手动切换场景背景
- ✅ **调试工具**: 内置调试面板和控制台工具

---

## 快速开始

### 1. 安装依赖

```bash
cd E:\偶像大师\tavern_helper_template
pnpm install
```

**已安装的依赖**:

- `pixi.js` v8.14.0
- `@pixi/spine-pixi` v2.1.1
- `vue3-pixi` v1.0.0-beta.3

### 2. 准备Spine资源

将Spine资源上传到GitHub CDN：

```
E:\偶像大师\闪耀色彩图片-最终版\spine\
├── mano\
│   ├── mano.atlas
│   ├── mano.json
│   └── mano.png
├── hiori\
│   ├── hiori.atlas
│   ├── hiori.json
│   └── hiori.png
└── ...（其他27个偶像）
```

上传到: `https://github.com/2426269/shinycolors-assets-cdn/`

### 3. 配置资源映射

编辑 `src/偶像大师闪耀色彩-重构/工具/spine-loader.ts`:

```typescript
export const SPINE_ASSETS_MAP: Record<string, SpineAsset> = {
  mano: {
    idolId: 'mano',
    atlasUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/spine/mano/mano.atlas',
    skeletonUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/spine/mano/mano.json',
  },
  // 添加其他偶像...
};
```

### 4. 在酒馆助手中加载

#### 方式A：作为前端界面加载

1. 编译项目：

```bash
pnpm run build -- --env build=偶像大师闪耀色彩-重构
```

2. 在酒馆中导航到：

```
dist/偶像大师闪耀色彩-重构/页面/Spine展示.html
```

#### 方式B：作为脚本加载

1. 编译脚本：

```bash
pnpm run build -- --env build=脚本示例
```

2. 在酒馆助手中加载：

```
dist/脚本示例/spine-controller/index.js
```

---

## 组件使用

### Spine播放器组件

#### 基础用法

```vue
<template>
  <Spine播放器
    :idol-id="'mano'"
    :width="800"
    :height="800"
    :scale="0.5"
    :auto-play="true"
    @loaded="onLoaded"
  />
</template>

<script setup lang="ts">
import Spine播放器 from '@/组件/Spine播放器.vue';

function onLoaded(spine) {
  console.log('Spine加载完成', spine);
}
</script>
```

#### Props

| 参数            | 类型      | 默认值  | 说明             |
| --------------- | --------- | ------- | ---------------- |
| `idolId`        | `string`  | 必填    | 偶像ID           |
| `width`         | `number`  | `800`   | 画布宽度         |
| `height`        | `number`  | `800`   | 画布高度         |
| `scale`         | `number`  | `0.5`   | 缩放比例         |
| `autoPlay`      | `boolean` | `true`  | 自动播放待机动画 |
| `showDebugInfo` | `boolean` | `false` | 显示调试信息     |

#### Events

| 事件名              | 参数             | 说明          |
| ------------------- | ---------------- | ------------- |
| `loaded`            | `(spine: Spine)` | Spine加载完成 |
| `error`             | `(error: Error)` | 加载失败      |
| `animationComplete` | `(name: string)` | 动画播放完成  |

#### 方法

```typescript
// 播放动画
spinePlayerRef.value.playAnimation('Emotion_Happy', false);

// 播放情绪动画（自动返回待机）
spinePlayerRef.value.playEmotion('Emotion_Sad');

// 播放交互动画
spinePlayerRef.value.playInteraction('Touch_Head');

// 获取可用动画列表
const animations = spinePlayerRef.value.getAvailableAnimations();

// 获取当前动画
const current = spinePlayerRef.value.getCurrentAnimation();
```

### Spine交互层组件

```vue
<template>
  <Spine交互层 @click="onInteractionClick" />
</template>

<script setup lang="ts">
function onInteractionClick(area: 'head' | 'body' | 'hand' | 'other') {
  console.log('点击了', area);
}
</script>
```

---

## 脚本系统

### 自动情感检测

脚本会自动检测AI消息中的关键词并播放对应动画：

| 情感 | 关键词示例           | 动画名称            |
| ---- | -------------------- | ------------------- |
| 高兴 | 高兴、开心、笑、哈哈 | `Emotion_Happy`     |
| 难过 | 难过、伤心、哭、呜呜 | `Emotion_Sad`       |
| 生气 | 生气、愤怒、讨厌     | `Emotion_Angry`     |
| 惊讶 | 惊讶、吓、诶、哇     | `Emotion_Surprise`  |
| 害羞 | 害羞、脸红、不好意思 | `Emotion_Shy`       |
| 疑惑 | 疑惑、困惑、为什么   | `Emotion_Confusion` |

### 手动控制

#### 使用 `<emotion>` 标签

在AI回复中添加标签：

```
真的吗？太好了！<emotion>高兴</emotion>
```

支持的标签值：

- `高兴`、`难过`、`生气`、`惊讶`、`害羞`、`疑惑`、`思考`

#### 使用调试工具

在浏览器控制台中：

```javascript
// 播放动画
window.__spineController.playAnimation('Emotion_Happy', false);

// 播放情绪动画
window.__spineController.playEmotion('Emotion_Happy');

// 播放说话动画
window.__spineController.playTalk();

// 停止说话
window.__spineController.stopTalk();

// 测试情感检测
window.__spineController.testEmotion('今天真开心！');
```

### 配置选项

编辑 `src/脚本示例/spine-controller/index.ts`:

```typescript
// 是否启用自动情感检测
const AUTO_EMOTION_DETECTION = true;

// 是否在AI回复时播放说话动画
const AUTO_PLAY_TALK_ANIMATION = true;

// 说话动画列表（随机选择）
const TALK_ANIMATIONS = ['Talk_01', 'Talk_Happy', 'Talk_Serious'];
```

---

## API参考

### spine-loader.ts

#### `loadSpineAsset(idolId: string): Promise<any>`

加载指定偶像的Spine资源。

```typescript
import { loadSpineAsset } from '@/工具/spine-loader';

const spineData = await loadSpineAsset('mano');
```

#### `preloadSpineAssets(idolIds: string[]): Promise<void>`

预加载多个偶像的Spine资源。

```typescript
await preloadSpineAssets(['mano', 'hiori', 'meguru']);
```

#### `getAnimationName(name: AnimationName | string): string`

获取标准化的动画名称。

```typescript
const animName = getAnimationName('happy'); // 返回 'Emotion_Happy'
```

### spine-animation-manager.ts

#### `SpineAnimationManager`

动画管理器类，提供动画播放控制。

```typescript
import { spineAnimationManager } from '@/工具/spine-animation-manager';

// 设置Spine实例
spineAnimationManager.setSpine(spine);

// 播放动画
spineAnimationManager.play('Emotion_Happy', false);

// 播放情绪动画
spineAnimationManager.playEmotion('Emotion_Sad');

// 播放说话动画
spineAnimationManager.playTalk('Talk_01');

// 停止说话
spineAnimationManager.stopTalk();

// 获取可用动画
const animations = spineAnimationManager.getAvailableAnimations();
```

### emotion-detector.ts

#### `detectEmotion(text: string): EmotionMatch | null`

检测文本中的情感。

```typescript
import { detectEmotion } from '@/脚本示例/spine-controller/emotion-detector';

const result = detectEmotion('今天真开心！');
// 返回: { emotion: 'happy', animation: 'Emotion_Happy', confidence: 0.8 }
```

#### `detectEmotionIntensity(text: string): number`

检测情感强度（用于调整动画速度）。

```typescript
const intensity = detectEmotionIntensity('太开心了！！！');
// 返回: 1.6 (基础1.0 + 感叹号0.6)
```

---

## 自定义扩展

### 添加新的偶像

1. 在 `spine-loader.ts` 中添加资源映射：

```typescript
export const SPINE_ASSETS_MAP: Record<string, SpineAsset> = {
  // ...现有偶像
  new_idol: {
    idolId: 'new_idol',
    atlasUrl: 'https://raw.githubusercontent.com/.../new_idol.atlas',
    skeletonUrl: 'https://raw.githubusercontent.com/.../new_idol.json',
  },
};
```

2. 使用：

```vue
<Spine播放器 :idol-id="'new_idol'" />
```

### 添加新的情感关键词

编辑 `emotion-detector.ts`:

```typescript
const EMOTION_KEYWORDS_MAP = {
  happy: {
    keywords: ['高兴', '开心', '快乐', '新关键词1', '新关键词2'],
    animation: 'Emotion_Happy',
    weight: 1.0,
  },
  // ...
};
```

### 自定义动画映射

编辑 `spine-controller/index.ts`:

```typescript
const EMOTION_ANIMATION_MAP: Record<string, string> = {
  高兴: 'Emotion_Happy',
  自定义情感: 'Custom_Animation',
  // ...
};
```

---

## 常见问题

### Q1: Spine资源加载失败怎么办？

**A**: 检查以下几点：

1. 确认GitHub CDN URL正确
2. 确认 `.atlas` 和 `.json` 文件路径匹配
3. 检查浏览器控制台错误信息
4. 尝试在浏览器直接访问资源URL

### Q2: 动画不播放或卡顿？

**A**:

1. 检查Spine资源是否正确加载
2. 查看控制台是否有错误
3. 确认动画名称是否正确（区分大小写）
4. 检查是否有动画队列冲突

### Q3: 情感检测不准确？

**A**:

1. 调整 `emotion-detector.ts` 中的关键词
2. 修改权重和置信度阈值
3. 使用 `<emotion>` 标签手动指定

### Q4: 如何在酒馆中集成？

**A**:

1. 编译项目：`pnpm run build`
2. 将 `dist/` 文件夹上传到Web服务器或GitHub Pages
3. 在酒馆助手中使用网络URL加载

### Q5: 如何添加背景音乐？

**A**:
参考 `项目开发大纲-革新版.md` 中的 `music-controller.ts` 脚本示例。

---

## 下一步计划

- [ ] 完善全部28个偶像的Spine资源
- [ ] 实现背景切换脚本
- [ ] 实现音乐控制脚本
- [ ] 添加更多交互动画
- [ ] 优化性能和资源占用
- [ ] 编写完整的测试用例

---

**文档版本**: v1.0  
**最后更新**: 2025-11-06  
**维护者**: AI助手



