$imageFolder = "E:\偶像大师\闪耀色彩图片资源\角色缩略图"
$tsFile = "E:\偶像大师\tavern_helper_template\src\偶像大师闪耀色彩-gacha\data\all-cards.ts"

Write-Host "读取数据库..." -ForegroundColor Yellow
$content = Get-Content $tsFile -Encoding UTF8 -Raw
$pattern = "fullName:\s*'([^']+)'"
$dbNames = [regex]::Matches($content, $pattern) | ForEach-Object { $_.Groups[1].Value }

Write-Host "数据库: $($dbNames.Count) 个卡片" -ForegroundColor Green

$dbSet = @{}
foreach($n in $dbNames) { $dbSet[$n] = $true }

$images = Get-ChildItem $imageFolder -Filter "*.png"
Write-Host "图片: $($images.Count) 个文件" -ForegroundColor Green
Write-Host ""

$toRename = @()

foreach($img in $images) {
    $name = $img.Name
    if($name -match '^(.+)_觉醒后\.png$') {
        $card = $Matches[1]
        $awakened = $true
    } elseif($name -match '^(.+)\.png$') {
        $card = $Matches[1]
        $awakened = $false
    } else { continue }
    
    if(-not $dbSet.ContainsKey($card)) {
        $toRename += @{old=$name; card=$card; awakened=$awakened}
    }
}

Write-Host "需要修正: $($toRename.Count)" -ForegroundColor Yellow

if($toRename.Count -gt 0) {
    Write-Host ""
    $toRename | Select-Object -First 10 | ForEach-Object {
        Write-Host "  $($_.old)" -ForegroundColor Gray
    }
    if($toRename.Count -gt 10) {
        Write-Host "  ... 还有 $($toRename.Count - 10) 个" -ForegroundColor Gray
    }
}