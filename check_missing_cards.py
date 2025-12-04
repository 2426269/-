#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查 real-cards.ts 中的卡片是否都有对应的文件
"""

import os
import re
from pathlib import Path

# 路径配置
CARD_DIR = Path(r"E:\偶像大师\闪耀色彩图片资源-压缩版\角色卡面")
REAL_CARDS_FILE = Path(r"E:\偶像大师\tavern_helper_template\src\偶像大师闪耀色彩-gacha\data\real-cards.ts")
NAME_MAPPINGS_FILE = Path(r"E:\偶像大师\tavern_helper_template\src\偶像大师闪耀色彩-gacha\data\name-mappings.ts")

def extract_cards_from_ts(file_path):
    """从 real-cards.ts 提取所有卡名"""
    content = file_path.read_text(encoding='utf-8')
    pattern = r"name:\s*'([^']+)'"
    return re.findall(pattern, content)

def extract_mappings(file_path):
    """从 name-mappings.ts 提取映射"""
    content = file_path.read_text(encoding='utf-8')
    
    # 提取角色映射
    char_match = re.search(r'export const CHARACTER_TO_ROMAN[^}]+\}', content, re.DOTALL)
    if not char_match:
        raise ValueError("无法找到 CHARACTER_TO_ROMAN")
    
    char_content = char_match.group(0)
    char_map = {}
    for match in re.finditer(r"['\"]?([^:'\"]+)['\"]?:\s*'([^']+)'", char_content):
        key = match.group(1).strip()
        value = match.group(2)
        char_map[key] = value
    
    # 提取主题映射
    theme_match = re.search(r'export const THEME_TO_ROMAN[^}]+\}', content, re.DOTALL)
    if not theme_match:
        raise ValueError("无法找到 THEME_TO_ROMAN")
    
    theme_content = theme_match.group(0)
    theme_map = {}
    for match in re.finditer(r"['\"]?([^:'\"]+)['\"]?:\s*'([^']+)'", theme_content):
        key = match.group(1).strip()
        value = match.group(2)
        theme_map[key] = value
    
    return char_map, theme_map

def card_name_to_filename(full_card_name, char_map, theme_map):
    """将卡名转换为文件名"""
    match = re.match(r'【(.+)】(.+)', full_card_name)
    if not match:
        return None
    
    theme, character = match.groups()
    
    theme_roman = theme_map.get(theme)
    char_roman = char_map.get(character)
    
    if not theme_roman or not char_roman:
        return None
    
    return f"{theme_roman}_{char_roman}"

def main():
    print("🔍 开始检查卡面文件...\n")
    
    # 1. 读取映射
    print("📖 读取映射表...")
    try:
        char_map, theme_map = extract_mappings(NAME_MAPPINGS_FILE)
        print(f"   - 角色映射: {len(char_map)} 个")
        print(f"   - 主题映射: {len(theme_map)} 个\n")
    except Exception as e:
        print(f"❌ 读取映射失败: {e}")
        return
    
    # 2. 读取所有卡名
    print("📖 读取 real-cards.ts...")
    card_names = extract_cards_from_ts(REAL_CARDS_FILE)
    print(f"   - 总共: {len(card_names)} 张卡\n")
    
    # 3. 检查文件
    print("🔍 检查文件存在性...\n")
    missing_cards = []
    error_cards = []
    success_count = 0
    
    for card_name in card_names:
        filename = card_name_to_filename(card_name, char_map, theme_map)
        
        if not filename:
            error_cards.append(card_name)
            print(f"⚠️  无法转换: {card_name}")
            continue
        
        webp_path = CARD_DIR / f"{filename}.webp"
        
        if not webp_path.exists():
            missing_cards.append(card_name)
            print(f"❌ 缺失: {card_name}")
            print(f"   → 期望文件: {filename}.webp")
        else:
            success_count += 1
    
    # 4. 输出汇总
    print("\n" + "=" * 80)
    print("📊 检查结果汇总\n")
    print(f"✅ 正常的卡: {success_count} 张")
    print(f"❌ 缺失的卡: {len(missing_cards)} 张")
    print(f"⚠️  无法转换的卡: {len(error_cards)} 张\n")
    
    if missing_cards:
        print("📝 需要添加到 UNAVAILABLE_CARDS 的卡片:\n")
        for card in missing_cards:
            print(f"  '{card}',")
    
    if error_cards:
        print("\n⚠️  无法转换文件名的卡片（需要更新映射）:\n")
        for card in error_cards:
            print(f"  '{card}',")

if __name__ == '__main__':
    main()




