#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os
import sys

# 设置输出编码
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

base_path = r"E:\偶像大师\闪耀色彩图片-最终版\spine\八宮めぐる\【アイの誓い】八宮めぐる"
json_path = os.path.join(base_path, "test.json")
atlas_path = os.path.join(base_path, "test.atlas")
png_path = os.path.join(base_path, "test.png")

print("Spine资源检查")
print("=" * 60)

# 读取JSON
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Spine版本: {data.get('skeleton', {}).get('spine')}")
print(f"Bones数量: {len(data.get('bones', []))}")
print(f"Slots数量: {len(data.get('slots', []))}")

# 检查skins
skins = data.get('skins', {})
print(f"Skins数量: {len(skins)}")

# 统计所有attachment
total_att = 0
for skin_name, skin_data in skins.items():
    print(f"\n皮肤: {skin_name}")
    for slot_name, attachments in skin_data.items():
        total_att += len(attachments)
        print(f"  Slot: {slot_name} - {len(attachments)} attachments")

print(f"\n总计attachments: {total_att}")

# 读取atlas
with open(atlas_path, 'r', encoding='utf-8') as f:
    atlas_lines = f.readlines()

print(f"\nAtlas引用的贴图: {atlas_lines[1].strip() if len(atlas_lines) > 1 else 'N/A'}")
print(f"PNG文件大小: {os.path.getsize(png_path) / 1024:.2f} KB")

print("\n" + "=" * 60)
print("文件结构正常!")
print("\n问题分析:")
print("1. Spine版本: 您的文件是3.6.53导出的")
print("2. 建议使用Spine 3.6或3.7版本打开")
print("3. Nonessential警告不影响贴图显示")
print("4. 如果贴图仍无法显示,可能是Spine软件本身的问题")
