# 清理 C 盘脚本 - 安全释放空间
# 使用方法：以管理员身份运行 PowerShell，然后执行此脚本

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " C 盘空间清理工具" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否以管理员身份运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  警告: 需要以管理员身份运行才能清理某些文件" -ForegroundColor Yellow
    Write-Host "请右键点击 PowerShell → 以管理员身份运行" -ForegroundColor Yellow
    Write-Host ""
}

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
Write-Host "[1/6] 清理 Windows 临时文件..." -ForegroundColor Cyan
$tempPaths = @(
    "$env:TEMP\*",
    "C:\Windows\Temp\*",
    "$env:LOCALAPPDATA\Temp\*"
)

$cleanedSize = 0
foreach ($path in $tempPaths) {
    if (Test-Path $path) {
        try {
            $items = Get-ChildItem -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            $size = ($items | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
            $cleanedSize += $size
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ 清理了 $([math]::Round($size / 1MB, 2)) MB" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  部分文件正在使用，已跳过" -ForegroundColor Yellow
        }
    }
}

# 2. 清理回收站
Write-Host "[2/6] 清理回收站..." -ForegroundColor Cyan
try {
    Clear-RecycleBin -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ 回收站已清空" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  无法清空回收站" -ForegroundColor Yellow
}

# 3. 清理浏览器缓存
Write-Host "[3/6] 清理浏览器缓存..." -ForegroundColor Cyan
$browserCachePaths = @(
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache\*",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache\*",
    "$env:APPDATA\Mozilla\Firefox\Profiles\*\cache2\*"
)

foreach ($path in $browserCachePaths) {
    if (Test-Path $path) {
        try {
            $items = Get-ChildItem -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            $size = ($items | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ 清理了 $([math]::Round($size / 1MB, 2)) MB" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  浏览器正在运行，已跳过" -ForegroundColor Yellow
        }
    }
}

# 4. 清理 Node.js 缓存
Write-Host "[4/6] 清理 Node.js 缓存..." -ForegroundColor Cyan
$nodeCachePaths = @(
    "$env:APPDATA\npm-cache\*",
    "$env:LOCALAPPDATA\pnpm\cache\*",
    "$env:LOCALAPPDATA\Yarn\Cache\*"
)

foreach ($path in $nodeCachePaths) {
    if (Test-Path $path) {
        try {
            $items = Get-ChildItem -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            $size = ($items | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ 清理了 $([math]::Round($size / 1MB, 2)) MB" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  部分缓存正在使用，已跳过" -ForegroundColor Yellow
        }
    }
}

# 5. 清理 Windows 更新缓存
Write-Host "[5/6] 清理 Windows 更新缓存..." -ForegroundColor Cyan
if ($isAdmin) {
    try {
        Stop-Service -Name wuauserv -Force -ErrorAction SilentlyContinue
        $updatePath = "C:\Windows\SoftwareDistribution\Download\*"
        if (Test-Path $updatePath) {
            $items = Get-ChildItem -Path $updatePath -Recurse -Force -ErrorAction SilentlyContinue
            $size = ($items | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
            Remove-Item -Path $updatePath -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ 清理了 $([math]::Round($size / 1MB, 2)) MB" -ForegroundColor Green
        }
        Start-Service -Name wuauserv -ErrorAction SilentlyContinue
    } catch {
        Write-Host "  ⚠️  无法清理 Windows 更新缓存" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  需要管理员权限" -ForegroundColor Yellow
}

# 6. 运行磁盘清理
Write-Host "[6/6] 启动 Windows 磁盘清理工具..." -ForegroundColor Cyan
Write-Host "  请手动勾选要清理的项目" -ForegroundColor Yellow
Start-Process cleanmgr.exe -ArgumentList "/d C:" -Wait

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
    Write-Host "⚠️  警告: C 盘空间仍然不足 10 GB" -ForegroundColor Red
    Write-Host "建议：" -ForegroundColor Yellow
    Write-Host "  1. 卸载不需要的程序" -ForegroundColor Yellow
    Write-Host "  2. 将大文件移动到 D 盘" -ForegroundColor Yellow
    Write-Host "  3. 清理 node_modules 文件夹" -ForegroundColor Yellow
} else {
    Write-Host "✓ C 盘空间已恢复到健康状态" -ForegroundColor Green
}

Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")




