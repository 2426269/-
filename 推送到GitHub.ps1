# 推送压缩后的角色卡面到GitHub
# 仓库: shinycolors-assets-cdn

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  偶像大师闪耀色彩 - 推送资源到GitHub CDN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$sourceDir = "E:\偶像大师\闪耀色彩图片资源-压缩版"
$repoUrl = "https://github.com/2426269/shinycolors-assets-cdn.git"

# 检查目录
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ 错误: 找不到源目录 $sourceDir" -ForegroundColor Red
    exit 1
}

cd $sourceDir

# 统计文件
Write-Host "📊 统计文件..." -ForegroundColor Yellow
$webpFiles = Get-ChildItem -Recurse -Filter *.webp
$webpCount = $webpFiles.Count
$totalSize = ($webpFiles | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "  WebP 文件: $webpCount 个" -ForegroundColor Green
Write-Host "  总大小: $sizeMB MB" -ForegroundColor Green
Write-Host ""

# 确认推送
Write-Host "📦 准备推送到: $repoUrl" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "确认推送? (y/n)"

if ($confirm -ne "y") {
    Write-Host "❌ 已取消" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 开始推送..." -ForegroundColor Cyan
Write-Host ""

# 初始化Git
Write-Host "1️⃣  初始化Git仓库..." -ForegroundColor Yellow
git init
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git初始化失败" -ForegroundColor Red
    exit 1
}

git branch -M main
Write-Host "✅ Git初始化完成" -ForegroundColor Green
Write-Host ""

# 创建 .gitignore
Write-Host "2️⃣  创建 .gitignore..." -ForegroundColor Yellow
@"
# 系统文件
*.log
*.tmp
.DS_Store
Thumbs.db
desktop.ini

# 编辑器
.vscode/
.idea/

# 临时文件
*.bak
*~
"@ | Out-File -FilePath .gitignore -Encoding utf8

Write-Host "✅ .gitignore 创建完成" -ForegroundColor Green
Write-Host ""

# 创建 README
Write-Host "3️⃣  创建 README.md..." -ForegroundColor Yellow
@"
# 偶像大师闪耀色彩 - CDN 资源

本仓库存储《偶像大师闪耀色彩》游戏的压缩资源文件，用于通过 jsDelivr CDN 加速访问。

## 📦 资源说明

### 角色卡面
- **格式**: WebP
- **数量**: $webpCount 张
- **总大小**: $sizeMB MB
- **压缩率**: ~85% (相比原始PNG)

### 使用方式

通过 jsDelivr CDN 访问:

``````
https://cdn.jsdelivr.net/gh/2426269/shinycolors-assets-cdn@main/角色卡面/[卡面名称].webp
``````

## 🎯 优势

- ✅ 文件体积减少 85%
- ✅ 加载速度提升 10-20倍
- ✅ 全球CDN加速
- ✅ 完美支持现代浏览器

## 📝 技术规格

- **图片格式**: WebP
- **压缩质量**: 85
- **命名规则**: 罗马音 (例: \`Ezoragutsu_Morino.Rinze.webp\`)

## 📄 许可

本仓库仅用于学习和研究目的。所有资源版权归 BANDAI NAMCO Entertainment Inc. 所有。

---

生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@ | Out-File -FilePath README.md -Encoding utf8

Write-Host "✅ README.md 创建完成" -ForegroundColor Green
Write-Host ""

# 添加所有文件
Write-Host "4️⃣  添加文件到Git..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 添加文件失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 文件添加完成" -ForegroundColor Green
Write-Host ""

# 提交
Write-Host "5️⃣  提交到本地仓库..." -ForegroundColor Yellow
git commit -m "初始提交: 添加压缩后的角色卡面 ($webpCount 张 WebP, $sizeMB MB)"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 提交失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 提交完成" -ForegroundColor Green
Write-Host ""

# 连接远程仓库
Write-Host "6️⃣  连接远程仓库..." -ForegroundColor Yellow
git remote add origin $repoUrl
Write-Host "✅ 远程仓库连接完成" -ForegroundColor Green
Write-Host ""

# 推送
Write-Host "7️⃣  推送到GitHub (这可能需要 15-25 分钟)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⏳ 正在推送 $sizeMB MB 数据..." -ForegroundColor Cyan
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  🎉 推送成功！" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 仓库地址: https://github.com/2426269/shinycolors-assets-cdn" -ForegroundColor Cyan
    Write-Host "🌐 CDN地址: https://cdn.jsdelivr.net/gh/2426269/shinycolors-assets-cdn@main" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ 下一步: 修改代码使用 jsDelivr CDN" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ 推送失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "常见问题:" -ForegroundColor Yellow
    Write-Host "1. 检查网络连接" -ForegroundColor Gray
    Write-Host "2. 确认GitHub账号已登录" -ForegroundColor Gray
    Write-Host "3. 确认仓库权限正确" -ForegroundColor Gray
    Write-Host ""
    Write-Host "可以重新运行此脚本再次尝试推送" -ForegroundColor Gray
    exit 1
}




