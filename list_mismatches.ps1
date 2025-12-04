$imageFolder = "E:\偶像大师\闪耀色彩图片资源\角色缩略图"
$tsFile = "E:\偶像大师\tavern_helper_template\src\偶像大师闪耀色彩-gacha\data\all-cards.ts"

$content = Get-Content $tsFile -Encoding UTF8 -Raw
$pattern = "fullName:\s*'([^']+)'"
$dbNames = [regex]::Matches($content, $pattern) | ForEach-Object { $_.Groups[1].Value }

$dbSet = @{}
foreach($n in $dbNames) { $dbSet[$n] = $true }

$images = Get-ChildItem $imageFolder -Filter "*.png"
$mismatches = @()

foreach($img in $images) {
    $name = $img.Name
    if($name -match '^(.+)_觉醒后\.png$') {
        $card = $Matches[1]
    } elseif($name -match '^(.+)\.png$') {
        $card = $Matches[1]
    } else { continue }
    
    if(-not $dbSet.ContainsKey($card)) {
        $mismatches += $card
    }
}

$mismatches | Select-Object -Unique | Sort-Object