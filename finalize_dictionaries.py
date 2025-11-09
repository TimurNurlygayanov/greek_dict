#!/usr/bin/env python3
"""
Final cleanup pass - fix spacing issues in English translations
"""

import json
import re

def fix_english_spacing(text: str) -> str:
    """Fix common spacing issues in English translations"""
    if not text:
        return text

    # Fix "to" prefix for verbs that got merged (tolove -> to love)
    text = re.sub(r'\bto([a-z]{3,})\b', r'to \1', text)

    # Fix other common merged words
    # Pattern: lowercase letter followed by uppercase (likeThis -> like This)
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)

    # Normalize multiple spaces
    text = re.sub(r'\s+', ' ', text)

    return text.strip()


def finalize_dictionary(input_file: str, output_file: str):
    """Apply final spacing fixes"""

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    fixed_count = 0
    for entry in data:
        original = entry['english']
        fixed = fix_english_spacing(original)

        if original != fixed:
            entry['english'] = fixed
            fixed_count += 1

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return len(data), fixed_count


if __name__ == "__main__":
    levels = ['A1', 'A2', 'B1', 'B2']

    print("\n" + "="*80)
    print("FINAL SPACING FIXES")
    print("="*80)

    for level in levels:
        input_file = f"dictionary_{level}_clean.json"
        output_file = f"dictionary_{level}_final.json"

        total, fixed = finalize_dictionary(input_file, output_file)

        print(f"\n{level}: {total} entries, {fixed} spacing fixes applied")
        print(f"   Saved to: {output_file}")

    print("\n" + "="*80)
    print("✨ All dictionaries finalized!")
    print("="*80)
