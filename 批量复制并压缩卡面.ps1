# ============================================================================
# 批量复制并压缩卡面
# 
# 基于扫描结果，将所有完整配对的卡面复制到目标目录并压缩为WebP
# ============================================================================

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8

# 配置
$JSON_INPUT = "E:\偶像大师\完整角色卡面列表.json"
$TARGET_DIR = "E:\偶像大师\闪耀色彩图片资源\角色卡面"
$COMPRESSED_DIR = "E:\偶像大师\闪耀色彩图片资源-压缩版\角色卡面"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  批量复制并压缩卡面" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查JSON文件
if (-not (Test-Path $JSON_INPUT)) {
    Write-Host "❌ 找不到JSON文件: $JSON_INPUT" -ForegroundColor Red
    Write-Host "   请先运行: 重新构建角色卡面列表.ps1" -ForegroundColor Yellow
    exit 1
}

# 读取JSON
Write-Host "📖 读取角色列表..." -ForegroundColor Cyan
$data = Get-Content $JSON_INPUT -Raw -Encoding UTF8 | ConvertFrom-Json

Write-Host "✅ 找到 $($data.TotalPairs) 组完整配对 (共 $($data.TotalImages) 张图片)" -ForegroundColor Green
Write-Host ""

# 确认操作
Write-Host "⚠️  此操作将:" -ForegroundColor Yellow
Write-Host "   1. 复制 $($data.TotalImages) 张图片到: $TARGET_DIR" -ForegroundColor White
Write-Host "   2. 压缩为WebP格式到: $COMPRESSED_DIR" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "继续吗? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ 已取消" -ForegroundColor Red
    exit 0
}

# 创建目标目录
if (-not (Test-Path $TARGET_DIR)) {
    New-Item -ItemType Directory -Path $TARGET_DIR -Force | Out-Null
    Write-Host "✅ 创建目录: $TARGET_DIR" -ForegroundColor Green
}

if (-not (Test-Path $COMPRESSED_DIR)) {
    New-Item -ItemType Directory -Path $COMPRESSED_DIR -Force | Out-Null
    Write-Host "✅ 创建目录: $COMPRESSED_DIR" -ForegroundColor Green
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  阶段 1: 复制原始图片" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$copiedCount = 0
$skippedCount = 0

foreach ($pair in $data.CompletePairs) {
    $cardName = $pair.CardName
    
    # 复制基础版
    $baseTarget = Join-Path $TARGET_DIR "$cardName.png"
    if (Test-Path $baseTarget) {
        Write-Host "⏭️  跳过 (已存在): $cardName.png" -ForegroundColor Gray
        $skippedCount++
    } else {
        Copy-Item -Path $pair.BasePath -Destination $baseTarget -Force
        Write-Host "✅ 复制: $cardName.png" -ForegroundColor Green
        $copiedCount++
    }
    
    # 复制觉醒版
    $awakenedTarget = Join-Path $TARGET_DIR "$cardName+.png"
    if (Test-Path $awakenedTarget) {
        Write-Host "⏭️  跳过 (已存在): $cardName+.png" -ForegroundColor Gray
        $skippedCount++
    } else {
        Copy-Item -Path $pair.AwakenedPath -Destination $awakenedTarget -Force
        Write-Host "✅ 复制: $cardName+.png" -ForegroundColor Green
        $copiedCount++
    }
}

Write-Host ""
Write-Host "📊 复制完成:" -ForegroundColor Cyan
Write-Host "   新复制: $copiedCount 张" -ForegroundColor Green
Write-Host "   已跳过: $skippedCount 张" -ForegroundColor Yellow
Write-Host ""

# 阶段2: 压缩
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  阶段 2: 压缩为WebP" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否安装了sharp
$sharpInstalled = npm list sharp --depth=0 2>$null
if (-not $sharpInstalled) {
    Write-Host "❌ 未安装 sharp 模块" -ForegroundColor Red
    Write-Host "   正在安装..." -ForegroundColor Yellow
    npm install sharp
}

# 运行压缩脚本
Write-Host "🔄 开始压缩..." -ForegroundColor Cyan
Write-Host ""

# 修改compress-images.js配置
$compressScript = @"
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

const SOURCE_DIR = '$($TARGET_DIR.Replace('\', '\\'))';
const OUTPUT_DIR = '$($COMPRESSED_DIR.Replace('\', '\\'))';

const QUALITY = 85;

async function compressImage(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: QUALITY })
      .toFile(outputPath);
    
    const inputSize = (await fs.stat(inputPath)).size;
    const outputSize = (await fs.stat(outputPath)).size;
    const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
    
    console.log(\`✅ \${path.basename(outputPath)} (减少 \${reduction}%)\`);
  } catch (error) {
    console.error(\`❌ 失败: \${path.basename(inputPath)}\`, error.message);
  }
}

async function main() {
  await fs.ensureDir(OUTPUT_DIR);
  
  const files = await fs.readdir(SOURCE_DIR);
  const imageFiles = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));
  
  console.log(\`📦 找到 \${imageFiles.length} 张图片\`);
  console.log('');
  
  let processed = 0;
  for (const file of imageFiles) {
    const inputPath = path.join(SOURCE_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
    
    // 跳过已存在的
    if (await fs.pathExists(outputPath)) {
      console.log(\`⏭️  跳过: \${file}\`);
      continue;
    }
    
    await compressImage(inputPath, outputPath);
    processed++;
  }
  
  console.log('');
  console.log(\`🎉 压缩完成！新处理: \${processed} 张\`);
}

main();
"@

$tempScript = "E:\偶像大师\temp-compress.js"
$compressScript | Out-File -FilePath $tempScript -Encoding UTF8

node $tempScript

Remove-Item $tempScript

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  完成！" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ 原始图片目录: $TARGET_DIR" -ForegroundColor Green
Write-Host "✅ 压缩图片目录: $COMPRESSED_DIR" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步:" -ForegroundColor Cyan
Write-Host "   1. 检查压缩后的图片" -ForegroundColor White
Write-Host "   2. 提交到Git: cd `"$COMPRESSED_DIR`" && git add . && git commit -m `"补充缺失的角色卡面`"" -ForegroundColor White
Write-Host "   3. 推送: git push" -ForegroundColor White
Write-Host ""











