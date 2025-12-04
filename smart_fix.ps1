$imageFolder = "E:\偶像大师\闪耀色彩图片资源\角色缩略图"
$tsFile = "E:\偶像大师\tavern_helper_template\src\偶像大师闪耀色彩-gacha\data\all-cards.ts"

Write-Host "========== 自动修正图片名 ==========" -ForegroundColor Cyan

$content = Get-Content $tsFile -Encoding UTF8 -Raw
$pattern = "fullName:\s*'([^']+)'"
$dbNames = [regex]::Matches($content, $pattern) | ForEach-Object { $_.Groups[1].Value }

$dbSet = @{}
$dbLookup = @{}
foreach($n in $dbNames) {
    $dbSet[$n] = $true
    # 创建标准化的key用于模糊匹配
    $normalized = $n -replace '\s+','_' -replace '','_'
    $dbLookup[$normalized] = $n
}

$images = Get-ChildItem $imageFolder -Filter "*.png"
$renamed = 0

foreach($img in $images) {
    $name = $img.Name
    if($name -match '^(.+)_觉醒后\.png$') {
        $card = $Matches[1]; $awakened = $true
    } elseif($name -match '^(.+)\.png$') {
        $card = $Matches[1]; $awakened = $false
    } else { continue }
    
    if($dbSet.ContainsKey($card)) { continue }
    
    # 标准化当前卡片名
    $normalized = $card -replace '\s+','_' -replace '','_'
    
    if($dbLookup.ContainsKey($normalized)) {
        $correctName = $dbLookup[$normalized]
        if($correctName -ne $card) {
            $newFileName = if($awakened) { "${correctName}_觉醒后.png" } else { "${correctName}.png" }
            $oldPath = $img.FullName
            $newPath = Join-Path $imageFolder $newFileName
            
            if(-not (Test-Path $newPath)) {
                Rename-Item $oldPath $newFileName
                Write-Host " $card -> $correctName" -ForegroundColor Green
                $renamed++
            }
        }
    } else {
        Write-Host "? $card" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "完成: $renamed 个文件" -ForegroundColor Green