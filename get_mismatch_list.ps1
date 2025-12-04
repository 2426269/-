$imageFolder = "E:\偶像大师\闪耀色彩图片资源\角色缩略图"
$tsFile = "E:\偶像大师\tavern_helper_template\src\偶像大师闪耀色彩-gacha\data\all-cards.ts"

Write-Host "========== 不匹配的卡片名单 ==========" -ForegroundColor Cyan
Write-Host ""

$content = Get-Content $tsFile -Encoding UTF8 -Raw
$pattern = "fullName:\s*'([^']+)'"
$dbNames = [regex]::Matches($content, $pattern) | ForEach-Object { $_.Groups[1].Value }

$dbSet = @{}
$dbByChar = @{}
foreach($n in $dbNames) { 
    $dbSet[$n] = $true
    if($n -match '^【.+】(.+)$') {
        $char = $Matches[1]
        if(-not $dbByChar.ContainsKey($char)) {
            $dbByChar[$char] = @()
        }
        $dbByChar[$char] += $n
    }
}

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
        if($card -match '^【(.+)】(.+)$') {
            $theme = $Matches[1]
            $char = $Matches[2]
            
            $suggestions = @()
            if($dbByChar.ContainsKey($char)) {
                foreach($dbName in $dbByChar[$char]) {
                    if($dbName -match '^【(.+)】') {
                        $dbTheme = $Matches[1]
                        $similarity = 0
                        $minLen = [Math]::Min($theme.Length, $dbTheme.Length)
                        for($i = 0; $i -lt $minLen; $i++) {
                            if($theme[$i] -eq $dbTheme[$i]) { $similarity++ }
                            else { break }
                        }
                        if($similarity -gt 3) {
                            $suggestions += @{name=$dbName; score=$similarity}
                        }
                    }
                }
            }
            
            $bestMatch = $suggestions | Sort-Object -Property score -Descending | Select-Object -First 1
            $mismatches += @{
                wrong = $card
                char = $char
                theme = $theme
                correct = if($bestMatch) { $bestMatch.name } else { "未找到匹配" }
                score = if($bestMatch) { $bestMatch.score } else { 0 }
            }
        }
    }
}

$mismatches = $mismatches | Sort-Object -Property char,theme -Unique

Write-Host "图片文件名（错误） | 数据库名称（正确）" -ForegroundColor Yellow
Write-Host "="*80 -ForegroundColor Gray
Write-Host ""

foreach($m in $mismatches) {
    Write-Host "错误: $($m.wrong)" -ForegroundColor Red
    Write-Host "正确: $($m.correct)" -ForegroundColor Green
    if($m.score -gt 0) {
        Write-Host "  相似度: $($m.score)" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "="*80 -ForegroundColor Gray
Write-Host "总计: $($mismatches.Count) 个需要修正" -ForegroundColor Cyan