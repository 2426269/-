# 转换剩余的PNG到WebP
$src = "E:\偶像大师\闪耀色彩图片资源\角色缩略图"
$dst = "E:\偶像大师\闪耀色彩图片-最终版\角色缩略图"

Write-Host "检查缺失的文件..." -ForegroundColor Cyan

$missing = @()
Get-ChildItem $src -Filter "*.png" | ForEach-Object {
    $targetName = [IO.Path]::GetFileNameWithoutExtension($_.Name) + ".webp"
    $targetPath = Join-Path $dst $targetName
    if (-not (Test-Path $targetPath)) {
        $missing += $_
    }
}

Write-Host "找到 $($missing.Count) 个未转换的文件" -ForegroundColor Yellow
Write-Host ""

$success = 0
$failed = 0
$index = 0

foreach ($file in $missing) {
    $index++
    
    # 使用临时文件名（纯数字）避免特殊字符问题
    $tempInput = Join-Path $env:TEMP "temp_$index.png"
    $tempOutput = Join-Path $env:TEMP "temp_$index.webp"
    
    try {
        # 复制到临时位置
        Copy-Item $file.FullName $tempInput -Force
        
        # 转换
        $null = & cwebp -q 85 $tempInput -o $tempOutput 2>&1
        
        if ($LASTEXITCODE -eq 0 -and (Test-Path $tempOutput)) {
            # 移动到最终位置
            $finalName = [IO.Path]::GetFileNameWithoutExtension($file.Name) + ".webp"
            $finalPath = Join-Path $dst $finalName
            Move-Item $tempOutput $finalPath -Force
            $success++
        } else {
            $failed++
        }
        
        # 清理临时文件
        if (Test-Path $tempInput) { Remove-Item $tempInput -Force }
        if (Test-Path $tempOutput) { Remove-Item $tempOutput -Force }
        
        if ($index % 20 -eq 0) {
            Write-Host "  进度: $index / $($missing.Count) (成功: $success, 失败: $failed)" -ForegroundColor Cyan
        }
    }
    catch {
        $failed++
        Write-Host "  错误: $($file.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========== 完成 ==========" -ForegroundColor Cyan
Write-Host "成功: $success" -ForegroundColor Green
Write-Host "失败: $failed" -ForegroundColor $(if($failed -eq 0){"Green"}else{"Red"})

# 最终统计
$totalWebp = (Get-ChildItem $dst -Filter "*.webp").Count
Write-Host ""
Write-Host "最终WebP文件总数: $totalWebp" -ForegroundColor $(if($totalWebp -eq 831){"Green"}else{"Yellow"})









