$src = "E:\偶像大师\闪耀色彩图片资源\角色缩略图"
$dst = "E:\偶像大师\闪耀色彩图片-最终版\角色缩略图"

Write-Host "========== 压缩转换 ==========" -ForegroundColor Cyan

$files = Get-ChildItem $src -Filter "*.png"
Write-Host "找到: $($files.Count) 个文件" -ForegroundColor Green

$cwebp = Get-Command cwebp -ErrorAction SilentlyContinue

if($cwebp) {
    Write-Host "使用 cwebp 压缩..." -ForegroundColor Yellow
    $count = 0
    foreach($f in $files) {
        $name = [IO.Path]::GetFileNameWithoutExtension($f.Name)
        $out = Join-Path $dst "$name.webp"
        & cwebp -q 85 $f.FullName -o $out 2>&1 | Out-Null
        $count++
        if($count % 50 -eq 0) { Write-Host "  $count / $($files.Count)" -ForegroundColor Cyan }
    }
} else {
    Write-Host "未找到cwebp，直接复制并重命名..." -ForegroundColor Yellow
    $count = 0
    foreach($f in $files) {
        $name = [IO.Path]::GetFileNameWithoutExtension($f.Name)
        $out = Join-Path $dst "$name.webp"
        Copy-Item $f.FullName $out -Force
        $count++
        if($count % 100 -eq 0) { Write-Host "  $count / $($files.Count)" -ForegroundColor Cyan }
    }
}

Write-Host ""
Write-Host "完成: $count 个文件" -ForegroundColor Green