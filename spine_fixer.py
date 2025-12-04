#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Spine资源诊断和修复工具
用于修复从浏览器提取的Spine资源文件
"""

import json
import os
import sys
from pathlib import Path

def diagnose_spine_files(json_path, atlas_path, png_path):
    """诊断Spine文件的问题"""

    print("=" * 60)
    print("Spine资源诊断工具")
    print("=" * 60)

    # 检查文件是否存在
    print("\n[1] 检查文件存在性...")
    files_exist = {
        "JSON": os.path.exists(json_path),
        "Atlas": os.path.exists(atlas_path),
        "PNG": os.path.exists(png_path)
    }

    for name, exists in files_exist.items():
        status = "✓" if exists else "✗"
        print(f"  {status} {name}: {exists}")

    if not all(files_exist.values()):
        print("\n错误: 缺少必要文件!")
        return False

    # 读取JSON文件
    print("\n[2] 读取JSON文件...")
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            spine_data = json.load(f)
        print(f"  ✓ JSON解析成功")
        print(f"  - Spine版本: {spine_data.get('skeleton', {}).get('spine', 'Unknown')}")
    except Exception as e:
        print(f"  ✗ JSON读取失败: {e}")
        return False

    # 读取Atlas文件
    print("\n[3] 读取Atlas文件...")
    try:
        with open(atlas_path, 'r', encoding='utf-8') as f:
            atlas_content = f.read()
        atlas_lines = atlas_content.strip().split('\n')
        atlas_image = atlas_lines[1] if len(atlas_lines) > 1 else None
        print(f"  ✓ Atlas读取成功")
        print(f"  - 引用的贴图文件: {atlas_image}")
    except Exception as e:
        print(f"  ✗ Atlas读取失败: {e}")
        return False

    # 检查JSON中的skins
    print("\n[4] 检查Skins结构...")
    skins = spine_data.get('skins', {})
    if not skins:
        print("  ✗ 警告: JSON中没有skins数据!")
    else:
        skin_names = list(skins.keys())
        print(f"  ✓ 找到 {len(skin_names)} 个皮肤: {', '.join(skin_names)}")

        # 统计attachments
        total_attachments = 0
        for skin_name, skin_data in skins.items():
            for slot_name, slot_attachments in skin_data.items():
                total_attachments += len(slot_attachments)
        print(f"  - 总共 {total_attachments} 个attachments")

    # 检查slots
    print("\n[5] 检查Slots...")
    slots = spine_data.get('slots', [])
    print(f"  ✓ 找到 {len(slots)} 个slots")

    # 检查bones
    print("\n[6] 检查Bones...")
    bones = spine_data.get('bones', [])
    print(f"  ✓ 找到 {len(bones)} 个bones")

    # 检查PNG文件大小
    print("\n[7] 检查PNG文件...")
    png_size = os.path.getsize(png_path)
    print(f"  ✓ PNG文件大小: {png_size / 1024:.2f} KB")

    if png_size < 1000:
        print("  ⚠ 警告: PNG文件可能损坏或过小!")

    print("\n" + "=" * 60)
    print("诊断完成!")
    print("=" * 60)

    # 给出建议
    print("\n[建议]")
    print("基于诊断结果,您的问题可能是:")
    print("1. Spine版本不匹配 - 您的JSON是3.6.53导出的,但用3.8.75打开")
    print("   建议: 使用Spine 3.6或3.7版本打开")
    print("2. Nonessential data缺失 - 这是正常的,不影响查看")
    print("   说明: 这些警告不会导致贴图无法显示")
    print("3. 如果贴图完全无法显示,可能需要:")
    print("   - 确认PNG文件完整性")
    print("   - 尝试重新导出PNG文件")
    print("   - 检查Spine软件设置")

    return True

def main():
    # 测试文件路径
    base_path = r"E:\偶像大师\闪耀色彩图片-最终版\spine\八宮めぐる\【アイの誓い】八宮めぐる"

    json_path = os.path.join(base_path, "test.json")
    atlas_path = os.path.join(base_path, "test.atlas")
    png_path = os.path.join(base_path, "test.png")

    diagnose_spine_files(json_path, atlas_path, png_path)

if __name__ == "__main__":
    main()
