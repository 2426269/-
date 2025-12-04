# ============================================================================
# 重新构建角色卡面列表
# 
# 目的: 扫描原始图片目录，找出所有成对的卡面（基础版 + 觉醒版+），
#       生成完整的角色列表，并准备批量压缩上传
# ============================================================================

$ErrorActionPreference = "Continue"
$OutputEncoding = [System.Text.Encoding]::UTF8

# 配置路径
$SOURCE_DIR = "E:\BaiduNetdiskDownload\闪耀色彩"
$OUTPUT_LIST = "E:\偶像大师\完整角色卡面列表.txt"
$OUTPUT_JSON = "E:\偶像大师\完整角色卡面列表.json"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  扫描原始卡面目录" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查源目录是否存在
if (-not (Test-Path $SOURCE_DIR)) {
    Write-Host "❌ 源目录不存在: $SOURCE_DIR" -ForegroundColor Red
    exit 1
}

Write-Host "📁 扫描目录: $SOURCE_DIR" -ForegroundColor Green
Write-Host ""

# 获取所有图片文件
$allFiles = Get-ChildItem -Path $SOURCE_DIR -File -Recurse | Where-Object {
    $_.Extension -match '\.(png|jpg|jpeg)$'
}

Write-Host "📊 找到图片文件总数: $($allFiles.Count)" -ForegroundColor Yellow
Write-Host ""

# 找到所有成对的卡面（有基础版和+版）
$pairedCards = @{}
$baseCards = @{}
$awakenedCards = @{}

foreach ($file in $allFiles) {
    $baseName = $file.BaseName
    
    # 检查是否是觉醒版（+后缀）
    if ($baseName -match '(.+)\+$') {
        $cardName = $Matches[1]
        $awakenedCards[$cardName] = $file
    } else {
        $baseCards[$baseName] = $file
    }
}

Write-Host "📈 统计信息:" -ForegroundColor Cyan
Write-Host "   基础版卡面: $($baseCards.Count) 张" -ForegroundColor White
Write-Host "   觉醒版卡面: $($awakenedCards.Count) 张" -ForegroundColor White
Write-Host ""

# 找到完整的成对卡面
$completePairs = @()
foreach ($cardName in $baseCards.Keys) {
    if ($awakenedCards.ContainsKey($cardName)) {
        $completePairs += [PSCustomObject]@{
            CardName = $cardName
            BasePath = $baseCards[$cardName].FullName
            AwakenedPath = $awakenedCards[$cardName].FullName
            BaseSize = $baseCards[$cardName].Length
            AwakenedSize = $awakenedCards[$cardName].Length
        }
    }
}

Write-Host "✅ 找到完整配对的卡面: $($completePairs.Count) 组 (共 $($completePairs.Count * 2) 张)" -ForegroundColor Green
Write-Host ""

# 找到不完整的卡面
$incompleteBase = @()
$incompleteAwakened = @()

foreach ($cardName in $baseCards.Keys) {
    if (-not $awakenedCards.ContainsKey($cardName)) {
        $incompleteBase += $cardName
    }
}

foreach ($cardName in $awakenedCards.Keys) {
    if (-not $baseCards.ContainsKey($cardName)) {
        $incompleteAwakened += $cardName
    }
}

if ($incompleteBase.Count -gt 0 -or $incompleteAwakened.Count -gt 0) {
    Write-Host "⚠️  不完整的卡面 (只有一张):" -ForegroundColor Yellow
    if ($incompleteBase.Count -gt 0) {
        Write-Host "   只有基础版: $($incompleteBase.Count) 张" -ForegroundColor Yellow
        $incompleteBase | Select-Object -First 5 | ForEach-Object {
            Write-Host "      - $_" -ForegroundColor Gray
        }
        if ($incompleteBase.Count -gt 5) {
            Write-Host "      ... 还有 $($incompleteBase.Count - 5) 张" -ForegroundColor Gray
        }
    }
    if ($incompleteAwakened.Count -gt 0) {
        Write-Host "   只有觉醒版: $($incompleteAwakened.Count) 张" -ForegroundColor Yellow
        $incompleteAwakened | Select-Object -First 5 | ForEach-Object {
            Write-Host "      - $_" -ForegroundColor Gray
        }
        if ($incompleteAwakened.Count -gt 5) {
            Write-Host "      ... 还有 $($incompleteAwakened.Count - 5) 张" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

# 按卡名排序
$completePairs = $completePairs | Sort-Object CardName

# 生成文本列表
Write-Host "📝 生成列表文件: $OUTPUT_LIST" -ForegroundColor Cyan
$listContent = @()
$listContent += "# 闪耀色彩完整角色卡面列表"
$listContent += "# 生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$listContent += "# 完整配对: $($completePairs.Count) 组 ($($completePairs.Count * 2) 张)"
$listContent += ""
$listContent += "## 完整配对的卡面"
$listContent += ""

foreach ($pair in $completePairs) {
    $listContent += "【$($pair.CardName)】"
    $listContent += "  基础版: $($pair.BasePath)"
    $listContent += "  觉醒版: $($pair.AwakenedPath)"
    $listContent += "  大小: $([math]::Round($pair.BaseSize/1KB, 2)) KB + $([math]::Round($pair.AwakenedSize/1KB, 2)) KB"
    $listContent += ""
}

# 保存到文件
$listContent | Out-File -FilePath $OUTPUT_LIST -Encoding UTF8
Write-Host "✅ 已保存到: $OUTPUT_LIST" -ForegroundColor Green
Write-Host ""

# 生成JSON格式（方便后续处理）
Write-Host "📝 生成JSON文件: $OUTPUT_JSON" -ForegroundColor Cyan
$jsonData = @{
    GeneratedAt = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    TotalPairs = $completePairs.Count
    TotalImages = $completePairs.Count * 2
    CompletePairs = $completePairs | ForEach-Object {
        @{
            CardName = $_.CardName
            BasePath = $_.BasePath
            AwakenedPath = $_.AwakenedPath
            BaseSize = $_.BaseSize
            AwakenedSize = $_.AwakenedSize
        }
    }
    IncompleteBase = $incompleteBase
    IncompleteAwakened = $incompleteAwakened
}

$jsonData | ConvertTo-Json -Depth 10 | Out-File -FilePath $OUTPUT_JSON -Encoding UTF8
Write-Host "✅ 已保存到: $OUTPUT_JSON" -ForegroundColor Green
Write-Host ""

# 显示摘要
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  扫描完成 - 摘要" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ 完整配对: $($completePairs.Count) 组" -ForegroundColor Green
Write-Host "⚠️  不完整 (仅基础版): $($incompleteBase.Count) 张" -ForegroundColor Yellow
Write-Host "⚠️  不完整 (仅觉醒版): $($incompleteAwakened.Count) 张" -ForegroundColor Yellow
Write-Host "📊 总图片数: $($allFiles.Count) 张" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 列表已保存:" -ForegroundColor White
Write-Host "   $OUTPUT_LIST" -ForegroundColor Gray
Write-Host "   $OUTPUT_JSON" -ForegroundColor Gray
Write-Host ""

# 显示前10个配对作为示例
Write-Host "📋 示例配对 (前10个):" -ForegroundColor Cyan
$completePairs | Select-Object -First 10 | ForEach-Object {
    Write-Host "   $($_.CardName)" -ForegroundColor White
}
if ($completePairs.Count -gt 10) {
    Write-Host "   ... 还有 $($completePairs.Count - 10) 个" -ForegroundColor Gray
}
Write-Host ""

Write-Host "🎉 扫描完成！下一步：运行复制和压缩脚本" -ForegroundColor Green











