# C 盘快速清理脚本
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " C 盘空间清理工具" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 获取当前 C 盘空间
$drive = Get-PSDrive C
$freeSpaceBefore = [math]::Round($drive.Free / 1GB, 2)
$totalSpace = [math]::Round(($drive.Used + $drive.Free) / 1GB, 2)

Write-Host "当前 C 盘状态:" -ForegroundColor Yellow
Write-Host "  可用空间: $freeSpaceBefore GB" -ForegroundColor Yellow
Write-Host "  总容量: $totalSpace GB" -ForegroundColor Yellow
Write-Host ""

Write-Host "开始清理..." -ForegroundColor Green
Write-Host ""

# 1. 清理 Windows 临时文件
Write-Host "[1/5] 清理 Windows 临时文件..." -ForegroundColor Cyan
try {
    $tempFiles = Get-ChildItem -Path "$env:TEMP\*" -Force -ErrorAction SilentlyContinue
    $tempSize = ($tempFiles | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  清理了 $([math]::Round($tempSize / 1MB, 2)) MB" -ForegroundColor Green
} catch {
    Write-Host "  部分文件正在使用，已跳过" -ForegroundColor Yellow
}

# 2. 清理系统临时文件
Write-Host "[2/5] 清理系统临时文件..." -ForegroundColor Cyan
try {
    $sysTemp = Get-ChildItem -Path "C:\Windows\Temp\*" -Force -ErrorAction SilentlyContinue
    $sysTempSize = ($sysTemp | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  清理了 $([math]::Round($sysTempSize / 1MB, 2)) MB" -ForegroundColor Green
} catch {
    Write-Host "  需要管理员权限，已跳过" -ForegroundColor Yellow
}

# 3. 清理回收站
Write-Host "[3/5] 清理回收站..." -ForegroundColor Cyan
try {
    Clear-RecycleBin -DriveLetter C -Force -ErrorAction SilentlyContinue -Confirm:$false
    Write-Host "  回收站已清空" -ForegroundColor Green
} catch {
    Write-Host "  无法清空回收站" -ForegroundColor Yellow
}

# 4. 清理浏览器缓存
Write-Host "[4/5] 清理 Chrome 浏览器缓存..." -ForegroundColor Cyan
$chromePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache"
if (Test-Path $chromePath) {
    try {
        $chromeCache = Get-ChildItem -Path "$chromePath\*" -Force -ErrorAction SilentlyContinue
        $chromeCacheSize = ($chromeCache | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        Remove-Item -Path "$chromePath\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  清理了 $([math]::Round($chromeCacheSize / 1MB, 2)) MB" -ForegroundColor Green
    } catch {
        Write-Host "  浏览器正在运行，已跳过" -ForegroundColor Yellow
    }
}

# 5. 清理 Node.js 缓存
Write-Host "[5/5] 清理 Node.js 缓存..." -ForegroundColor Cyan
$pnpmCache = "$env:LOCALAPPDATA\pnpm\cache"
if (Test-Path $pnpmCache) {
    try {
        $pnpmCacheFiles = Get-ChildItem -Path "$pnpmCache\*" -Force -ErrorAction SilentlyContinue
        $pnpmCacheSize = ($pnpmCacheFiles | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        Remove-Item -Path "$pnpmCache\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  清理了 $([math]::Round($pnpmCacheSize / 1MB, 2)) MB" -ForegroundColor Green
    } catch {
        Write-Host "  部分缓存正在使用，已跳过" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host " 清理完成！" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# 获取清理后的空间
$drive = Get-PSDrive C
$freeSpaceAfter = [math]::Round($drive.Free / 1GB, 2)
$cleaned = $freeSpaceAfter - $freeSpaceBefore

Write-Host ""
Write-Host "清理结果:" -ForegroundColor Cyan
Write-Host "  清理前: $freeSpaceBefore GB" -ForegroundColor White
Write-Host "  清理后: $freeSpaceAfter GB" -ForegroundColor White
Write-Host "  释放空间: $cleaned GB" -ForegroundColor Green
Write-Host ""

if ($freeSpaceAfter -lt 10) {
    Write-Host "警告: C 盘空间仍然不足 10 GB" -ForegroundColor Red
    Write-Host ""
    Write-Host "建议使用 Windows 磁盘清理工具进一步清理:" -ForegroundColor Yellow
    Write-Host "  1. 按 Win+R，输入 cleanmgr，回车" -ForegroundColor Yellow
    Write-Host "  2. 选择 C 盘，点击确定" -ForegroundColor Yellow
    Write-Host "  3. 点击'清理系统文件'" -ForegroundColor Yellow
    Write-Host "  4. 勾选所有项目，特别是'Windows 更新清理'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "是否现在启动磁盘清理工具? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'Y' -or $response -eq 'y') {
        Start-Process cleanmgr.exe -ArgumentList "/d C:"
        Write-Host "已启动磁盘清理工具" -ForegroundColor Green
    }
} else {
    Write-Host "C 盘空间已恢复到健康状态" -ForegroundColor Green
}

Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")




