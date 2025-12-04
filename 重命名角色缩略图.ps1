# 重命名角色缩略图脚本
# 根据txt文件中的编号和角色名映射，重命名图片文件

$ErrorActionPreference = "Stop"
$txtPath = "C:\Users\33987\Desktop\新建 文本文档.txt"
$imageFolder = "E:\偶像大师\闪耀色彩图片资源\角色缩略图"

Write-Host "========== 角色缩略图重命名脚本 ==========" -ForegroundColor Cyan
Write-Host ""

# 检查文件和文件夹是否存在
if (-not (Test-Path $txtPath)) {
    Write-Host "错误: 找不到txt文件: $txtPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $imageFolder)) {
    Write-Host "错误: 找不到图片文件夹: $imageFolder" -ForegroundColor Red
    exit 1
}

Write-Host "正在读取txt文件..." -ForegroundColor Yellow
$content = Get-Content $txtPath -Encoding UTF8 -Raw

# 解析txt文件，建立编号到角色名的映射
$cardMapping = @{}
$lines = $content -split "`n"

Write-Host "正在解析角色信息..." -ForegroundColor Yellow

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i].Trim()
    
    # 查找包含 CardIcon 的行 (非FES版本)
    if ($line -match '\[\[File:CardIcon-(\d+)\.png\]\]') {
        $cardNumber = $Matches[1]
        
        # 继续向后查找，找到对应的日文标题行
        # 通常格式是 |【xx】<br>角色名
        for ($j = $i + 1; $j -lt [Math]::Min($i + 10, $lines.Count); $j++) {
            $titleLine = $lines[$j].Trim()
            
            # 匹配日文标题格式: |【xx】<br>角色名 或 |【xx】角色名
            if ($titleLine -match '^\|【(.+?)】(?:<br>)?(.+?)$') {
                $title = $Matches[1]
                $name = $Matches[2].Trim()
                $fullName = "【${title}】${name}"
                $cardMapping[$cardNumber] = $fullName
                Write-Host "  找到: $cardNumber -> $fullName" -ForegroundColor Gray
                break
            }
        }
    }
}

Write-Host ""
Write-Host "成功解析 $($cardMapping.Count) 个角色映射" -ForegroundColor Green
Write-Host ""

# 获取所有png图片
$images = Get-ChildItem $imageFolder -Filter "*.png"
Write-Host "找到 $($images.Count) 个png图片文件" -ForegroundColor Green
Write-Host ""

# 统计信息
$renamedCount = 0
$skippedCount = 0
$errorCount = 0

Write-Host "开始重命名..." -ForegroundColor Yellow
Write-Host ""

foreach ($image in $images) {
    $oldName = $image.Name
    
    # 提取卡片编号和是否FES
    # 格式: imgi_xxx_CardIcon-1234567890.png 或 imgi_xxx_CardIcon-1234567890_FES.png
    if ($oldName -match 'CardIcon-(\d+)(_FES)?\.png$') {
        $cardNumber = $Matches[1]
        $isFes = $Matches[2] -eq "_FES"
        
        # 查找对应的角色名
        if ($cardMapping.ContainsKey($cardNumber)) {
            $characterName = $cardMapping[$cardNumber]
            
            # 构建新文件名
            if ($isFes) {
                $newName = "${characterName}_觉醒后.png"
            } else {
                $newName = "${characterName}.png"
            }
            
            # 检查新文件名是否已存在
            $newPath = Join-Path $imageFolder $newName
            if (Test-Path $newPath) {
                Write-Host "  [跳过] $oldName" -ForegroundColor Yellow
                Write-Host "         目标文件已存在: $newName" -ForegroundColor Yellow
                $skippedCount++
            } else {
                try {
                    # 执行重命名
                    Rename-Item -Path $image.FullName -NewName $newName
                    Write-Host "  [成功] $oldName" -ForegroundColor Green
                    Write-Host "      -> $newName" -ForegroundColor Green
                    $renamedCount++
                } catch {
                    Write-Host "  [错误] $oldName" -ForegroundColor Red
                    Write-Host "         错误: $($_.Exception.Message)" -ForegroundColor Red
                    $errorCount++
                }
            }
        } else {
            Write-Host "  [跳过] $oldName" -ForegroundColor Yellow
            Write-Host "         未找到编号 $cardNumber 的映射" -ForegroundColor Yellow
            $skippedCount++
        }
    } else {
        Write-Host "  [跳过] $oldName" -ForegroundColor Yellow
        Write-Host "         无法解析文件名格式" -ForegroundColor Yellow
        $skippedCount++
    }
}

Write-Host ""
Write-Host "========== 重命名完成 ==========" -ForegroundColor Cyan
Write-Host "成功: $renamedCount 个文件" -ForegroundColor Green
Write-Host "跳过: $skippedCount 个文件" -ForegroundColor Yellow
Write-Host "错误: $errorCount 个文件" -ForegroundColor Red
Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")







