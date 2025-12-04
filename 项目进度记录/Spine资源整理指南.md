# Spine资源整理指南

**日期**: 2025-11-06  
**用途**: 将Spine导出的资源整理并集成到项目中

---

## 📁 标准文件结构

### 原始导出文件

Spine导出的文件通常命名为：
```
data.atlas
data.json
data.png
```

### 目标结构

需要整理成以下结构：

```
E:\偶像大师\闪耀色彩图片-最终版\spine\
├── mano\           # 樱木真乃
│   ├── mano.atlas
│   ├── mano.json
│   └── mano.png
├── hiori\          # 风野灯织
│   ├── hiori.atlas
│   ├── hiori.json
│   └── hiori.png
├── meguru\         # 八宫惠
│   ├── meguru.atlas
│   ├── meguru.json
│   └── meguru.png
└── ...（其他25个偶像）
```

---

## 🔄 批量重命名脚本

### PowerShell 脚本

创建文件 `E:\偶像大师\闪耀色彩图片-最终版\spine\整理资源.ps1`:

```powershell
# Spine资源批量整理脚本
# 用法: 将原始的 data.* 文件放在对应的偶像文件夹中，然后运行此脚本

# 偶像ID映射
$idols = @{
    "mano" = "樱木真乃"
    "hiori" = "风野灯织"
    "meguru" = "八宫惠"
    "kogane" = "月冈恋钟"
    "mamimi" = "田中摩美美"
    "sakuya" = "白濑咲耶"
    "yuika" = "三峰结华"
    "kiriko" = "幽谷雾子"
    "amana" = "小宫果穗"
    "tenka" = "园田智代子"
    "chiyoko" = "大崎甜花"
    "juri" = "桑山千雪"
    "rinze" = "芹泽朝日"
    "natsuha" = "黛冬优子"
    "saki" = "和泉爱依"
    "mei" = "杜野凛世"
    "toru" = "市川雏菜"
    "madoka" = "福丸小糸"
    "koito" = "有栖川夏叶"
    "asahi" = "西城树里"
    "fuyuko" = "樋口圆香"
    "ai" = "福路美穗子"
    "hinana" = "周防桃子"
    "rio" = "七草花梨"
    "karin" = "白石沙希"
    "saki2" = "斑鸠卢卡"
    "ruka" = "八宫惠"
    "nichka" = "幽谷雾子"
}

# 获取当前目录下所有子文件夹
$spineDir = "E:\偶像大师\闪耀色彩图片-最终版\spine"
Get-ChildItem -Path $spineDir -Directory | ForEach-Object {
    $idolId = $_.Name
    $folderPath = $_.FullName
    
    Write-Host "处理偶像: $idolId" -ForegroundColor Cyan
    
    # 检查是否存在 data.* 文件
    $atlasFile = Join-Path $folderPath "data.atlas"
    $jsonFile = Join-Path $folderPath "data.json"
    $pngFile = Join-Path $folderPath "data.png"
    
    if (Test-Path $atlasFile) {
        $newAtlas = Join-Path $folderPath "$idolId.atlas"
        
        # 读取atlas文件内容并替换图片引用
        $content = Get-Content $atlasFile -Raw
        $content = $content -replace "data\.png", "$idolId.png"
        Set-Content -Path $newAtlas -Value $content
        
        Write-Host "  ✅ 已创建: $idolId.atlas" -ForegroundColor Green
        
        # 删除原文件
        Remove-Item $atlasFile
    }
    
    if (Test-Path $jsonFile) {
        $newJson = Join-Path $folderPath "$idolId.json"
        Rename-Item -Path $jsonFile -NewName $newJson
        Write-Host "  ✅ 已重命名: $idolId.json" -ForegroundColor Green
    }
    
    if (Test-Path $pngFile) {
        $newPng = Join-Path $folderPath "$idolId.png"
        Rename-Item -Path $pngFile -NewName $newPng
        Write-Host "  ✅ 已重命名: $idolId.png" -ForegroundColor Green
    }
    
    # 验证文件
    $hasAtlas = Test-Path (Join-Path $folderPath "$idolId.atlas")
    $hasJson = Test-Path (Join-Path $folderPath "$idolId.json")
    $hasPng = Test-Path (Join-Path $folderPath "$idolId.png")
    
    if ($hasAtlas -and $hasJson -and $hasPng) {
        Write-Host "  ✅ $idolId 资源完整" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ $idolId 资源不完整" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "处理完成！" -ForegroundColor Green
```

### 使用方法

1. **创建文件夹结构**:
```powershell
cd "E:\偶像大师\闪耀色彩图片-最终版\spine"

# 创建所有偶像文件夹
$idols = @("mano", "hiori", "meguru", "kogane", "mamimi", "sakuya", "yuika", "kiriko", "amana", "tenka")
foreach ($idol in $idols) {
    New-Item -ItemType Directory -Force -Path $idol
    Write-Host "✅ 已创建文件夹: $idol"
}
```

2. **放置文件**:
   - 将每个偶像的 `data.atlas`, `data.json`, `data.png` 放入对应文件夹

3. **运行脚本**:
```powershell
cd "E:\偶像大师\闪耀色彩图片-最终版\spine"
.\整理资源.ps1
```

---

## 📤 上传到GitHub

### 1. 初始化Git（如果还没有）

```bash
cd "E:\偶像大师\闪耀色彩图片-最终版"
git init
git remote add origin https://github.com/2426269/shinycolors-assets-cdn.git
```

### 2. 添加并提交Spine资源

```bash
# 添加spine文件夹
git add spine/

# 提交
git commit -m "添加Spine动画资源 - 28个偶像"

# 推送到GitHub
git push origin main
```

### 3. 验证上传

访问以下URL确认文件可访问：
```
https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/spine/mano/mano.atlas
https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/spine/mano/mano.json
https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/spine/mano/mano.png
```

---

## ⚙️ 更新项目配置

### 更新 spine-loader.ts

编辑 `src/偶像大师闪耀色彩-重构/工具/spine-loader.ts`:

```typescript
export const SPINE_ASSETS_MAP: Record<string, SpineAsset> = {
  mano: {
    idolId: 'mano',
    atlasUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/spine/mano/mano.atlas',
    skeletonUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/spine/mano/mano.json',
  },
  hiori: {
    idolId: 'hiori',
    atlasUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/spine/hiori/hiori.atlas',
    skeletonUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/spine/hiori/hiori.json',
  },
  meguru: {
    idolId: 'meguru',
    atlasUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/spine/meguru/meguru.atlas',
    skeletonUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/spine/meguru/meguru.json',
  },
  // ... 添加其他25个偶像
};
```

---

## 🧪 测试

### 1. 本地测试（推荐先测试）

在上传到GitHub前，可以先本地测试：

```typescript
// 临时使用本地文件路径测试
const SPINE_ASSETS_MAP_LOCAL: Record<string, SpineAsset> = {
  mano: {
    idolId: 'mano',
    atlasUrl: 'file:///E:/偶像大师/闪耀色彩图片-最终版/spine/mano/mano.atlas',
    skeletonUrl: 'file:///E:/偶像大师/闪耀色彩图片-最终版/spine/mano/mano.json',
  },
};
```

**注意**: 浏览器可能会因为CORS限制无法加载本地文件，建议使用本地HTTP服务器：

```bash
# 使用Python启动简单HTTP服务器
cd "E:\偶像大师\闪耀色彩图片-最终版"
python -m http.server 8000

# 然后访问
# http://localhost:8000/spine/mano/mano.json
```

### 2. 编译测试

```bash
cd "E:\偶像大师\tavern_helper_template"

# 编译项目
pnpm run build -- --env build=偶像大师闪耀色彩-重构

# 在浏览器中打开测试
# dist/偶像大师闪耀色彩-重构/页面/Spine展示.html
```

### 3. 检查点

- [ ] 文件结构正确（每个偶像文件夹包含3个文件）
- [ ] 文件命名一致（idolId.atlas, idolId.json, idolId.png）
- [ ] atlas文件中的PNG引用正确
- [ ] 上传到GitHub成功
- [ ] CDN URL可访问
- [ ] Spine播放器能正确加载
- [ ] 动画列表显示正常
- [ ] 动画播放流畅

---

## 🐛 常见问题

### Q1: atlas文件中PNG路径不对？

**A**: 需要修改atlas文件的第一行：

```diff
- data.png
+ mano.png
```

可以使用文本编辑器或脚本批量替换。

### Q2: 加载失败，控制台显示404？

**A**: 
1. 检查GitHub文件是否上传成功
2. 确认URL路径正确（注意大小写）
3. 等待几分钟，GitHub CDN可能需要缓存时间

### Q3: 加载很慢？

**A**: 
1. 检查文件大小，PNG文件不应超过500KB
2. 考虑压缩PNG图片
3. 使用CDN加速服务

### Q4: 动画列表为空？

**A**: 
1. 检查JSON文件是否完整
2. 打开浏览器开发者工具查看错误信息
3. 确认Spine版本兼容（建议使用Spine 3.8或4.0）

---

## 📋 偶像ID对照表

| ID      | 偶像名     | 组合               |
| ------- | ---------- | ------------------ |
| mano    | 樱木真乃   | Illumination STARS |
| hiori   | 风野灯织   | Illumination STARS |
| meguru  | 八宫惠     | Illumination STARS |
| kogane  | 月冈恋钟   | L'Antica           |
| mamimi  | 田中摩美美 | L'Antica           |
| sakuya  | 白濑咲耶   | L'Antica           |
| yuika   | 三峰结华   | 放课后Climax Girls |
| kiriko  | 幽谷雾子   | 放课后Climax Girls |
| amana   | 小宫果穗   | 放课后Climax Girls |
| tenka   | 大崎甜花   | ALSTROEMERIA       |
| chiyoko | 园田智代子 | ALSTROEMERIA       |
| juri    | 桑山千雪   | ALSTROEMERIA       |
| rinze   | 杜野凛世   | SHHis              |
| natsuha | 黛冬优子   | SHHis              |
| asahi   | 芹泽朝日   | SHHis              |
| fuyuko  | 市川雏菜   | noctchill          |
| ai      | 和泉爱依   | noctchill          |
| mei     | 福丸小糸   | noctchill          |
| rio     | 有栖川夏叶 | noctchill          |
| karin   | 西城树里   | Straylight         |
| hinana  | 樋口圆香   | Straylight         |
| koito   | 福路美穗子 | Straylight         |
| saki    | 周防桃子   | ALSTROEMERIA       |
| madoka  | 七草花梨   | -                  |
| nichka  | 白石沙希   | -                  |
| toru    | 斑鸠卢卡   | -                  |

---

## 🎯 快速开始

如果您现在就有一个偶像的资源，可以这样快速测试：

### 1. 创建文件夹

```bash
mkdir "E:\偶像大师\闪耀色彩图片-最终版\spine\mano"
```

### 2. 复制文件并重命名

- 将您的 `data.atlas` 复制为 `mano.atlas`
- 将您的 `data.json` 复制为 `mano.json`
- 将您的 `data.png` 复制为 `mano.png`

### 3. 修改atlas文件

打开 `mano.atlas`，将第一行改为：
```
mano.png
```

### 4. 测试

```bash
cd "E:\偶像大师\tavern_helper_template"
pnpm run build -- --env build=偶像大师闪耀色彩-重构
```

然后在浏览器中打开：
```
dist/偶像大师闪耀色彩-重构/页面/Spine展示.html
```

---

**文档版本**: v1.0  
**最后更新**: 2025-11-06  
**相关文档**: `Spine动画系统使用文档.md`




