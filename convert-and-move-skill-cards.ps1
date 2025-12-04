# 技能卡图片批量转换和移动脚本

$sourceDir = "E:\偶像大师\闪耀色彩图片资源\歌曲图片\【学マス】スキルカード一覧【学園アイドルマスター】｜ゲームエイト"
$targetDir = "E:\偶像大师\闪耀色彩图片-最终版\技能卡卡面"

Write-Host "===== 技能卡图片处理开始 =====" -ForegroundColor Green
Write-Host ""

# 确保目标目录存在
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "✓ 创建目标目录: $targetDir" -ForegroundColor Green
}

# 切换到源目录
Set-Location $sourceDir

# 统计初始文件
$pngFiles = Get-ChildItem -Filter "*.png"
$jpgFiles = Get-ChildItem -Filter "*.jpg"
$existingWebp = Get-ChildItem -Filter "*.webp"

Write-Host "📊 初始统计:" -ForegroundColor Cyan
Write-Host "   PNG文件: $($pngFiles.Count)" -ForegroundColor Yellow
Write-Host "   JPG文件: $($jpgFiles.Count)" -ForegroundColor Yellow
Write-Host "   已有WebP: $($existingWebp.Count)" -ForegroundColor Yellow
Write-Host ""

# 转换PNG到WebP
$converted = 0
Write-Host "🔄 开始转换PNG文件..." -ForegroundColor Cyan
foreach ($file in $pngFiles) {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $webpName = "$baseName.webp"
    
    # 检查是否已存在对应的webp文件
    if (Test-Path $webpName) {
        Write-Host "   ⏭️  跳过（已存在）: $webpName" -ForegroundColor Gray
        continue
    }
    
    # 使用cwebp转换（质量90，适度压缩）
    $result = & cwebp -q 90 $file.FullName -o $webpName 2>&1
    if ($LASTEXITCODE -eq 0) {
        $converted++
        Write-Host "   ✓ 转换完成: $($file.Name) → $webpName" -ForegroundColor Green
    } else {
        Write-Host "   ✗ 转换失败: $($file.Name)" -ForegroundColor Red
    }
}

# 转换JPG到WebP
Write-Host ""
if ($jpgFiles.Count -gt 0) {
    Write-Host "🔄 开始转换JPG文件..." -ForegroundColor Cyan
    foreach ($file in $jpgFiles) {
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        $webpName = "$baseName.webp"
        
        if (Test-Path $webpName) {
            Write-Host "   ⏭️  跳过（已存在）: $webpName" -ForegroundColor Gray
            continue
        }
        
        $result = & cwebp -q 90 $file.FullName -o $webpName 2>&1
        if ($LASTEXITCODE -eq 0) {
            $converted++
            Write-Host "   ✓ 转换完成: $($file.Name) → $webpName" -ForegroundColor Green
        } else {
            Write-Host "   ✗ 转换失败: $($file.Name)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "✅ 转换完成！新转换: $converted 个文件" -ForegroundColor Green
Write-Host ""

# 移动所有WebP文件到目标目录
Write-Host "📦 开始移动WebP文件..." -ForegroundColor Cyan
$allWebp = Get-ChildItem -Filter "*.webp"
$moved = 0

foreach ($file in $allWebp) {
    $targetPath = Join-Path $targetDir $file.Name
    
    # 如果目标已存在，先删除
    if (Test-Path $targetPath) {
        Remove-Item $targetPath -Force
    }
    
    Copy-Item $file.FullName $targetPath -Force
    $moved++
    Write-Host "   ✓ 移动: $($file.Name)" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ 移动完成！共移动: $moved 个WebP文件" -ForegroundColor Green
Write-Host ""

# 最终统计
$finalCount = (Get-ChildItem $targetDir -Filter "*.webp" | Measure-Object).Count
Write-Host "📊 最终统计:" -ForegroundColor Cyan
Write-Host "   目标目录WebP文件总数: $finalCount" -ForegroundColor Yellow
Write-Host ""

if ($finalCount -eq 299) {
    Write-Host "🎉 完美！299张技能卡卡面全部就绪！" -ForegroundColor Green
}
elseif ($finalCount -gt 299) {
    Write-Host "⚠️  注意：文件数量($finalCount)超过预期(299)" -ForegroundColor Yellow
}
else {
    Write-Host "⚠️  注意：文件数量($finalCount)少于预期(299)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===== 处理完成 =====" -ForegroundColor Green



