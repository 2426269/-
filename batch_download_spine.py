#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Spine 资源批量下载脚本
使用方法：
1. 在 spine.shinycolors.moe 按 F12 → Network → 勾选 "Preserve log"
2. 依次切换所有角色和服装
3. 右键 Network 面板 → "Save all as HAR with content"
4. 保存为 spine_resources.har
5. 运行此脚本: python batch_download_spine.py
"""

import json
import os
import time
from pathlib import Path
from urllib.parse import urlparse
import requests

# ===== 配置 =====
HAR_FILE = 'spine_resources.har'  # HAR 文件路径
OUTPUT_DIR = r'E:\偶像大师\spine资源'  # 输出目录
DELAY = 0.5  # 下载延迟（秒）

# ===== 函数定义 =====

def extract_spine_urls(har_file):
    """从 HAR 文件中提取所有 Spine 资源 URL"""
    print(f"📖 读取 HAR 文件: {har_file}")
    
    if not os.path.exists(har_file):
        print(f"❌ 错误: HAR 文件不存在 - {har_file}")
        print(f"💡 请按照以下步骤操作:")
        print(f"   1. 打开 spine.shinycolors.moe")
        print(f"   2. F12 → Network → 勾选 'Preserve log'")
        print(f"   3. 依次切换所有角色和服装")
        print(f"   4. 右键 Network 面板 → 'Save all as HAR with content'")
        print(f"   5. 保存为 spine_resources.har")
        return []
    
    with open(har_file, 'r', encoding='utf-8') as f:
        try:
            har_data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"❌ 错误: 无法解析 HAR 文件 - {e}")
            return []
    
    spine_files = []
    extensions = ['.json', '.atlas', '.png']
    
    for entry in har_data.get('log', {}).get('entries', []):
        url = entry['request']['url']
        
        # 检查是否是 Spine 资源
        if 'spine' in url.lower() and any(ext in url for ext in extensions):
            spine_files.append(url)
    
    print(f"✓ 找到 {len(spine_files)} 个 Spine 资源文件")
    return spine_files

def parse_spine_url(url):
    """解析 Spine URL，提取卡牌ID、类型、文件名
    
    URL 格式: https://cf-static.shinycolors.moe/spine/idols/stand/1040010010/data.json
                                                      ^^^^  ^^^^^  ^^^^^^^^^^
                                                      类型  姿势    卡牌ID
    """
    # 分解 URL
    parts = url.split('/')
    filename = parts[-1].split('?')[0]
    
    try:
        # 查找 'idols' 关键字的位置
        idols_index = next(i for i, part in enumerate(parts) if part == 'idols')
        
        # 提取信息
        pose_type = parts[idols_index + 1]  # 'stand' 或 'stand_costume'
        card_id = parts[idols_index + 2]     # 卡牌ID，如 '1040010010'
        
        # 解析卡牌ID（推测格式：前4位可能是角色编号）
        # 例如：1040010010
        #       104 = 角色编号
        #       001 = 稀有度
        #       0010 = 卡牌序号
        character_code = card_id[:3] if len(card_id) >= 10 else card_id[:4]
        
        # 组合一个易读的文件夹名
        # 例如：104_1040010010_stand
        folder_name = f"{character_code}_{card_id}_{pose_type}"
        
        return {
            'url': url,
            'idol_id': character_code,      # 角色编号（用于分组）
            'costume_id': folder_name,       # 完整标识（确保唯一）
            'card_id': card_id,              # 原始卡牌ID
            'pose_type': pose_type,          # 姿势类型
            'filename': filename
        }
    
    except (IndexError, StopIteration, ValueError):
        # 兜底方案
        print(f"⚠️  无法解析 URL: {url}")
        import hashlib
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        return {
            'url': url,
            'idol_id': 'unknown',
            'costume_id': url_hash,
            'card_id': 'unknown',
            'pose_type': 'unknown',
            'filename': filename
        }

def download_file(url, filepath):
    """下载文件"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        file_size = len(response.content) / 1024  # KB
        return True, file_size
    except requests.RequestException as e:
        return False, str(e)

def download_spine_resources(urls, output_dir):
    """批量下载 Spine 资源"""
    print(f"\n📦 开始下载，输出目录: {output_dir}")
    print(f"=" * 60)
    
    # 解析所有 URL
    parsed_urls = []
    for url in urls:
        parsed = parse_spine_url(url)
        if parsed:
            parsed_urls.append(parsed)
    
    if not parsed_urls:
        print("❌ 没有可下载的资源")
        return
    
    # 按角色和服装分组
    resources = {}
    for item in parsed_urls:
        key = f"{item['idol_id']}/{item['costume_id']}"
        if key not in resources:
            resources[key] = []
        resources[key].append(item)
    
    total_resources = len(resources)
    current_index = 0
    success_count = 0
    fail_count = 0
    
    # 下载每个资源组
    for key, items in resources.items():
        current_index += 1
        idol_id, costume_id = key.split('/')
        
        print(f"\n[{current_index}/{total_resources}] {idol_id} - {costume_id}")
        
        # 创建目录
        save_dir = Path(output_dir) / idol_id / costume_id
        save_dir.mkdir(parents=True, exist_ok=True)
        
        # 下载每个文件
        for item in items:
            filepath = save_dir / item['filename']
            
            # 检查文件是否已存在
            if filepath.exists():
                file_size = filepath.stat().st_size / 1024
                print(f"  ✓ {item['filename']} (已存在，{file_size:.2f} KB)")
                success_count += 1
                continue
            
            print(f"  → 下载 {item['filename']}...", end='', flush=True)
            
            success, result = download_file(item['url'], filepath)
            
            if success:
                print(f" ✓ ({result:.2f} KB)")
                success_count += 1
            else:
                print(f" ✗ 失败: {result}")
                fail_count += 1
            
            # 延迟
            time.sleep(DELAY)
    
    print(f"\n{'=' * 60}")
    print(f"✓ 下载完成！")
    print(f"  成功: {success_count} 个文件")
    print(f"  失败: {fail_count} 个文件")
    print(f"  输出目录: {output_dir}")
    
    # 统计结果
    total_folders = sum(1 for _ in Path(output_dir).rglob("costume_*"))
    total_files = sum(1 for _ in Path(output_dir).rglob("*") if _.is_file())
    
    print(f"\n📊 统计:")
    print(f"  服装数: {total_folders}")
    print(f"  文件数: {total_files}")
    print(f"\n💡 提示: 将 Spine 资源上传到 GitHub 仓库后，即可在项目中使用！")

# ===== 主程序 =====

def main():
    print("=" * 60)
    print("  Spine 资源批量下载器 (Python版)")
    print("=" * 60)
    print()
    
    # 提取 URL
    urls = extract_spine_urls(HAR_FILE)
    
    if not urls:
        print("\n❌ 未找到 Spine 资源，请检查 HAR 文件")
        return
    
    # 下载资源
    download_spine_resources(urls, OUTPUT_DIR)

if __name__ == '__main__':
    main()

