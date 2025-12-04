$imageFolder = "E:\偶像大师\闪耀色彩图片资源\角色缩略图"
$tsFile = "E:\偶像大师\tavern_helper_template\src\偶像大师闪耀色彩-gacha\data\all-cards.ts"

Write-Host "========== 自动修正图片名 ==========" -ForegroundColor Cyan
Write-Host ""

$content = Get-Content $tsFile -Encoding UTF8 -Raw
$pattern = "fullName:\s*'([^']+)'"
$dbNames = [regex]::Matches($content, $pattern) | ForEach-Object { $_.Groups[1].Value }

$dbSet = @{}
$dbByThemeChar = @{}
foreach($n in $dbNames) {
    $dbSet[$n] = $true
    if($n -match '^【(.+)】(.+)$') {
        $theme = $Matches[1]
        $char = $Matches[2]
        $key = "$theme|$char"
        $dbByThemeChar[$key] = $n
    }
}

$images = Get-ChildItem $imageFolder -Filter "*.png"
$renamed = 0

foreach($img in $images) {
    $name = $img.Name
    if($name -match '^(.+)_觉醒后\.png$') {
        $card = $Matches[1]
        $awakened = $true
    } elseif($name -match '^(.+)\.png$') {
        $card = $Matches[1]
        $awakened = $false
    } else { continue }
    
    if($dbSet.ContainsKey($card)) { continue }
    
    # 提取主题和角色
    if($card -match '^【(.+)】(.+)$') {
        $theme = $Matches[1]
        $char = $Matches[2]
        $key = "$theme|$char"
        
        if($dbByThemeChar.ContainsKey($key)) {
            $correctName = $dbByThemeChar[$key]
            $newFileName = if($awakened) { "${correctName}_觉醒后.png" } else { "${correctName}.png" }
            $oldPath = Join-Path $imageFolder $name
            $newPath = Join-Path $imageFolder $newFileName
            
            if(-not (Test-Path $newPath)) {
                Rename-Item $oldPath $newFileName
                Write-Host " $name" -ForegroundColor Green
                Write-Host "  -> $newFileName" -ForegroundColor Cyan
                $renamed++
            }
        }
    }
}

Write-Host ""
Write-Host "完成: $renamed 个文件已修正" -ForegroundColor Green