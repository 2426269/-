# 最终修正映射表
# 图片名 -> 数据库正确名

$mapping = @{
  '【1／60NaturalHeart】白瀬咲耶' = '【1／60・NaturalHeart】白瀬咲耶'
  '【Be red】ルビー' = '【Be red】ルビー'  # 可能没问题，需要检查
  '【Kn☆cking.Kn☆cking.】園田智代子' = '【Kn♡cking.Kn♡cking.】園田智代子'
  '【new or …】斑鳩ルカ' = '【new or…】斑鳩ルカ'
  '【SS】市川雛菜' = '【♯SS】市川雛菜'
  '【You''re My Dream】園田智代子' = '【You''re My Dream】園田智代子'  # 可能没问题
  '【あそ→と♡ちよこれいと】園田智代子' = '【あそ→と♡ちよこれいと】園田智代子'  # 可能没问题
  '【おかえり、ギター】浅倉透' = '【おかえり、ギター】浅倉透'  # 可能没问题
  '【きゅん♡コメ】八宮めぐる' = '【きゅん♡コメ】八宮めぐる'  # 可能没问題
  '【ご褒美、いるよね♪】和泉愛依' = '【ご褒美、いるよね♪】和泉愛依'  # 可能没问题
  '【ザ・冬優子イズム】黛冬優子' = '【ア・冬優子イズム】黛冬優子'
  '【シンメトリープールサイド】大崎甜花' = '【シンメトリー・プールサイド】大崎甜花'
  '【たそかれスワッグ】八宮めぐる' = '【たそかれスワッグ】八宮めぐる'  # 可能没问题
  '【チョコ色×きらきらロマン】園田智代子' = '【チョコ色×きらきらロマン】園田智代子'  # 可能没问题
  '【なつやすみ学校】福丸小糸' = '【なつやすみ学校】福丸小糸'  # 可能没问题
  '【ピックアップ・スプリング】櫻木真乃' = '【ピックアップ・スプリング】櫻木真乃'  # 可能没问题
  '【ひとつ、はたたく】櫻木真乃' = '【ひとつ、はたたく】櫻木真乃'  # 可能没问题
  '【憧憬リキュールー】大崎甘奈' = '【憧憬リキュール】大崎甘奈'
  '【凛凛、凛世】杜野凛世' = '【凛凛、凛世】杜野凛世'  # 可能没问题
  '【竜宮城へご招待☆】大崎甘奈' = '【竜宮城へご招待☆】大崎甘奈'  # 可能没问题
  '【甜花ちゃんといっしょ】大崎甘奈' = '【甜花ちゃんといっしょ☆】大崎甘奈'
  '【雪空セパレート】大崎甘奈' = '【雪空セパレート】大崎甘奈'  # 可能没问题
}

$imageFolder = "E:\偶像大师\闪耀色彩图片资源\角色缩略图"
$renamed = 0

Write-Host "========== 最终修正 ==========" -ForegroundColor Cyan
Write-Host ""

foreach($old in $mapping.Keys) {
    $new = $mapping[$old]
    if($old -eq $new) { continue }  # 跳过没有变化的
    
    $files = Get-ChildItem $imageFolder -Filter "*${old}*.png"
    foreach($file in $files) {
        $newName = $file.Name -replace [regex]::Escape($old), $new
        $newPath = Join-Path $imageFolder $newName
        
        if(-not (Test-Path $newPath)) {
            Rename-Item $file.FullName $newName
            Write-Host "✓ $($file.Name)" -ForegroundColor Green
            Write-Host "  -> $newName" -ForegroundColor Cyan
            $renamed++
        }
    }
}

Write-Host ""
Write-Host "完成: $renamed 个文件" -ForegroundColor Green









