# 批量下载 Spine 资源脚本
# 使用方法：
# 1. 在 spine.shinycolors.moe 按 F12 → Network → 勾选 "Preserve log"
# 2. 依次切换所有角色和服装，让 Network 面板抓取所有资源
# 3. 手动记录下所有 .json, .atlas, .png 文件的 URL
# 4. 填入下方的 $resources 数组
# 5. 运行此脚本

$outputDir = "E:\偶像大师\spine资源"
$ErrorActionPreference = "Continue"

# ===== 资源列表（需要手动填写） =====
# 格式：@{ idol = "角色ID"; costume = "服装ID"; baseUrl = "基础URL" }
# 
# 示例：如果资源URL是 https://spine.shinycolors.moe/assets/spine/mano/costume_001/model.json
# 则填写：@{ idol = "mano"; costume = "costume_001"; baseUrl = "https://spine.shinycolors.moe/assets/spine" }

$resources = @(
    # 樱木真乃
    @{ idol = "mano"; costume = "costume_001"; baseUrl = "https://spine.shinycolors.moe/assets/spine" },
    @{ idol = "mano"; costume = "costume_002"; baseUrl = "https://spine.shinycolors.moe/assets/spine" },
    
    # 风野灯织
    @{ idol = "hiori"; costume = "costume_001"; baseUrl = "https://spine.shinycolors.moe/assets/spine" },
    
    # 八宫巡
    @{ idol = "meguru"; costume = "costume_001"; baseUrl = "https://spine.shinycolors.moe/assets/spine" },
    
    # 市川雏菜
    @{ idol = "kogane"; costume = "costume_001"; baseUrl = "https://spine.shinycolors.moe/assets/spine" }
    
    # ... 添加更多角色和服装
)

# ===== 下载逻辑 =====

$totalResources = $resources.Count
$currentIndex = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Spine 资源批量下载器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "输出目录: $outputDir" -ForegroundColor Yellow
Write-Host "资源数量: $totalResources" -ForegroundColor Yellow
Write-Host ""

foreach ($res in $resources) {
    $currentIndex++
    $idolDir = Join-Path $outputDir $res.idol
    $costumeDir = Join-Path $idolDir $res.costume
    
    # 创建目录
    if (-not (Test-Path $costumeDir)) {
        New-Item -ItemType Directory -Force -Path $costumeDir | Out-Null
    }
    
    Write-Host "[$currentIndex/$totalResources] " -NoNewline -ForegroundColor Green
    Write-Host "下载: $($res.idol) - $($res.costume)" -ForegroundColor White
    
    # 下载三个文件
    $files = @("model.json", "model.atlas", "model.png")
    $successCount = 0
    
    foreach ($file in $files) {
        $url = "$($res.baseUrl)/$($res.idol)/$($res.costume)/$file"
        $output = Join-Path $costumeDir $file
        
        # 检查文件是否已存在
        if (Test-Path $output) {
            Write-Host "  ✓ $file (已存在，跳过)" -ForegroundColor Gray
            $successCount++
            continue
        }
        
        Write-Host "  → 下载 $file..." -NoNewline
        
        try {
            Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
            $fileSize = (Get-Item $output).Length / 1KB
            Write-Host " ✓ ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
            $successCount++
        } catch {
            Write-Host " ✗ 失败: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # 延迟 0.5 秒，避免请求过快
        Start-Sleep -Milliseconds 500
    }
    
    if ($successCount -eq 3) {
        Write-Host "  ✓ 完成 ($($res.idol)/$($res.costume))" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ 部分失败 ($successCount/3)" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ 批量下载完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "输出目录: $outputDir" -ForegroundColor Yellow

# 统计结果
$totalFolders = (Get-ChildItem -Path $outputDir -Recurse -Directory | Where-Object { $_.Name -like "costume_*" }).Count
$totalFiles = (Get-ChildItem -Path $outputDir -Recurse -File).Count

Write-Host "已下载服装数: $totalFolders" -ForegroundColor Yellow
Write-Host "已下载文件数: $totalFiles" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 提示: 将 Spine 资源上传到 GitHub 仓库后，即可在项目中使用！" -ForegroundColor Cyan




