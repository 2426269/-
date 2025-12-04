# 实时监控图片压缩进度
# 每3秒自动刷新

$outputDir = "E:\偶像大师\闪耀色彩图片资源-压缩版\角色卡面"
$totalExpected = 281  # 预期总文件数

Write-Host "=== 图片压缩实时监控 ===" -ForegroundColor Cyan
Write-Host "按 Ctrl+C 停止监控" -ForegroundColor Gray
Write-Host ""

while ($true) {
    Clear-Host
    
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║      偶像大师闪耀色彩 - 图片压缩监控          ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Path $outputDir) {
        # 统计文件数量
        $pngFiles = Get-ChildItem -Path $outputDir -Recurse -Filter *.png -ErrorAction SilentlyContinue
        $webpFiles = Get-ChildItem -Path $outputDir -Recurse -Filter *.webp -ErrorAction SilentlyContinue
        
        $pngCount = $pngFiles.Count
        $webpCount = $webpFiles.Count
        
        # 计算总大小
        $allFiles = Get-ChildItem -Path $outputDir -Recurse -ErrorAction SilentlyContinue
        $totalSize = ($allFiles | Measure-Object -Property Length -Sum).Sum
        $sizeMB = [math]::Round($totalSize / 1MB, 2)
        
        # 计算进度
        $progress = [math]::Round(($webpCount / $totalExpected) * 100, 1)
        
        # 显示统计
        Write-Host "📊 当前状态:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  PNG 文件:   " -NoNewline
        Write-Host "$pngCount / $totalExpected" -ForegroundColor Green
        
        Write-Host "  WebP 文件:  " -NoNewline
        Write-Host "$webpCount / $totalExpected" -ForegroundColor Green
        
        Write-Host "  总文件数:   " -NoNewline
        Write-Host "$($pngCount + $webpCount)" -ForegroundColor Cyan
        
        Write-Host "  总大小:     " -NoNewline
        Write-Host "$sizeMB MB" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "📈 进度:" -ForegroundColor Yellow
        Write-Host ""
        
        # 进度条
        $barLength = 40
        $filled = [math]::Floor($barLength * $progress / 100)
        $empty = $barLength - $filled
        
        Write-Host "  " -NoNewline
        Write-Host ("█" * $filled) -NoNewline -ForegroundColor Green
        Write-Host ("░" * $empty) -NoNewline -ForegroundColor DarkGray
        Write-Host " $progress%" -ForegroundColor Yellow
        
        Write-Host ""
        
        # 预估剩余时间
        if ($webpCount -gt 0) {
            $avgTimePerFile = 8  # 每张约8秒
            $remaining = $totalExpected - $webpCount
            $remainingMinutes = [math]::Round(($remaining * $avgTimePerFile) / 60, 1)
            
            Write-Host "⏱️  预估剩余时间: " -NoNewline -ForegroundColor Yellow
            Write-Host "$remainingMinutes 分钟" -ForegroundColor Cyan
        }
        
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        
        # 显示最新压缩的文件
        if ($webpFiles.Count -gt 0) {
            $latestFiles = $webpFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 5
            Write-Host ""
            Write-Host "📁 最近压缩的文件:" -ForegroundColor Yellow
            Write-Host ""
            
            foreach ($file in $latestFiles) {
                $fileName = $file.Name
                $fileSize = [math]::Round($file.Length / 1KB, 0)
                $time = $file.LastWriteTime.ToString("HH:mm:ss")
                Write-Host "  ✓ $fileName" -ForegroundColor Green
                Write-Host "    ($fileSize KB - $time)" -ForegroundColor Gray
            }
        }
        
        # 检查是否完成
        if ($webpCount -ge $totalExpected) {
            Write-Host ""
            Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
            Write-Host "║              🎉 压缩完成！                    ║" -ForegroundColor Green
            Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
            Write-Host ""
            Write-Host "总计: $($pngCount + $webpCount) 个文件" -ForegroundColor Cyan
            Write-Host "大小: $sizeMB MB" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "按任意键退出..." -ForegroundColor Gray
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            break
        }
        
    } else {
        Write-Host "⏳ 等待压缩开始..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "输出目录尚未创建，脚本可能还在初始化..." -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "最后更新: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""
    Write-Host "按 Ctrl+C 停止监控" -ForegroundColor DarkGray
    
    Start-Sleep -Seconds 3
}



