$ErrorActionPreference = "Stop"
$imageFolder = "E:\偶像大师\闪耀色彩图片资源\角色缩略图"
$dbNamesFile = "E:\偶像大师\db_names.json"

Write-Host "========== 图片名称对比修正 ==========" -ForegroundColor Cyan
Write-Host ""

Write-Host "正在读取数据库名称..." -ForegroundColor Yellow
$dbNames = Get-Content $dbNamesFile -Encoding UTF8 | ConvertFrom-Json
Write-Host "数据库: $($dbNames.Count) 个卡片" -ForegroundColor Green
Write-Host ""

$dbNameSet = @{}
foreach ($name in $dbNames) {
    $dbNameSet[$name] = $true
}

$images = Get-ChildItem $imageFolder -Filter "*.png"
Write-Host "图片: $($images.Count) 个文件" -ForegroundColor Green
Write-Host ""

$matchCount = 0
$mismatchCount = 0
$mismatches = @()

Write-Host "开始对比..." -ForegroundColor Yellow
Write-Host ""

foreach ($image in $images) {
    $fileName = $image.Name
    $cardName = $fileName
    if ($fileName -match '^(.+)_觉醒后\.png$') {
        $cardName = $Matches[1]
        $isAwakened = $true
    } elseif ($fileName -match '^(.+)\.png$') {
        $cardName = $Matches[1]
        $isAwakened = $false
    } else {
        continue
    }
    
    if ($dbNameSet.ContainsKey($cardName)) {
        $matchCount++
    } else {
        $bestMatch = $null
        $bestScore = 0
        
        foreach ($dbName in $dbNames) {
            $score = 0
            $minLen = [Math]::Min($cardName.Length, $dbName.Length)
            for ($i = 0; $i -lt $minLen; $i++) {
                if ($cardName[$i] -eq $dbName[$i]) {
                    $score++
                } else {
                    break
                }
            }
            
            if ($score -gt $bestScore) {
                $bestScore = $score
                $bestMatch = $dbName
            }
        }
        
        if ($bestMatch -and $bestScore -gt 5) {
            $mismatches += @{
                current = $fileName
                cardName = $cardName
                suggested = $bestMatch
                isAwakened = $isAwakened
                score = $bestScore
            }
            $mismatchCount++
        }
    }
}

Write-Host ""
Write-Host "========== 对比结果 ==========" -ForegroundColor Cyan
Write-Host "完全匹配: $matchCount" -ForegroundColor Green
Write-Host "需要修正: $mismatchCount" -ForegroundColor Yellow
Write-Host ""

if ($mismatchCount -gt 0) {
    Write-Host "发现不匹配的文件:" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($mismatch in $mismatches) {
        Write-Host "当前: $($mismatch.current)" -ForegroundColor White
        Write-Host "  应为: $($mismatch.suggested)" -ForegroundColor Cyan
        Write-Host ""
    }
    
    $confirm = Read-Host "是否执行重命名(y/n)"
    
    if ($confirm -eq 'y') {
        Write-Host ""
        Write-Host "开始重命名..." -ForegroundColor Yellow
        Write-Host ""
        
        $renamedCount = 0
        foreach ($mismatch in $mismatches) {
            $oldPath = Join-Path $imageFolder $mismatch.current
            $newFileName = if ($mismatch.isAwakened) {
                "$($mismatch.suggested)_觉醒后.png"
            } else {
                "$($mismatch.suggested).png"
            }
            $newPath = Join-Path $imageFolder $newFileName
            
            if (-not (Test-Path $newPath)) {
                try {
                    Rename-Item -Path $oldPath -NewName $newFileName
                    Write-Host "  [OK] $($mismatch.current) -> $newFileName" -ForegroundColor Green
                    $renamedCount++
                } catch {
                    Write-Host "  [ERR] $($mismatch.current)" -ForegroundColor Red
                }
            }
        }
        
        Write-Host ""
        Write-Host "修正完成: $renamedCount" -ForegroundColor Green
    }
} else {
    Write-Host "所有图片名称都与数据库匹配!" -ForegroundColor Green
}







