#!/usr/bin/env python3
"""
Clean and validate existing dictionary JSON files
Removes proper nouns, corrupted entries, and improves data quality
"""

import json
import re
import unicodedata
from typing import List, Dict, Tuple

# Common Greek first names and place names to filter out
PROPER_NOUNS = {
    # People names (Greek)
    'Αγγελική', 'Άγγελος', 'Αθανασία', 'Αθηνά', 'Αιμιλία', 'Αλεξάνδρα',
    'Αλέξης', 'Αλεξία', 'Αλίκη', 'Άννα', 'Ανέστης', 'Αναστασία', 'Αντιγόνη',
    'Αντρέας', 'Αντώνης', 'Απόστολος', 'Αποστόλης', 'Βασίλης', 'Βασιλική',
    'Βάσω', 'Γιάννης', 'Γιώργος', 'Γρηγόρης', 'Δήμητρα', 'Δημήτρης',
    'Ηρακλής', 'Παύλος', 'Πέτρος', 'Φίλιππος',
    # People names (English)
    'Angelica', 'Angelo', 'Alice', 'Anna', 'Alexandra', 'Alex', 'Alexia',
    'Andrew', 'Anthony', 'Apostolos', 'Athanassia', 'Athina', 'Emilia',
    'Gregory', 'Jim', 'Dimitris', 'Dimitra', 'John', 'George', 'Paul',
    'Peter', 'Philip', 'Vassilis', 'Vassiliki', 'Vasso', 'Hercules',
    # Places (countries, cities)
    'Αγγλία', 'Αίγινα', 'Αίγυπτος', 'Αλβανία', 'Αλεξάνδρεια',
    'Αλεξανδρούπολη', 'Αμερική', 'Άμστερνταμ', 'Ανδριανούπολη', 'Αργοστόλι',
    'Αρμενία', 'Αυστραλία', 'Αυστρία', 'Αφρική', 'Βελιγράδι', 'Βέλγιο',
    'Βενεζουέλα', 'Βερολίνο', 'Βιέννη', 'Βουλγαρία', 'Βραζιλία', 'Βρετανία',
    'Βρυξέλλες', 'Γαλλία', 'Γερμανία', 'Δανία', 'Δουβλίνο', 'Ελλάδα',
    'Ζάκυνθος', 'Ζυρίχη', 'Θεσσαλονίκη', 'Ιαπωνία', 'Ιρλανδία', 'Ισλανδία',
    'Ισπανία', 'Ισραήλ', 'Ιταλία', 'Καναδάς', 'Κέρκυρα', 'Κίνα', 'Κορέα',
    'Κρήτη', 'Κροατία', 'Λονδίνο', 'Λουξεμβούργο', 'Μόσχα', 'Μύκονος',
    'Νορβηγία', 'Ολλανδία', 'Ουγγαρία', 'Ουκρανία', 'Πακιστάν', 'Παναμάς',
    'Παρίσι', 'Πετρούπολη', 'Πορτογαλία', 'Ρώμη', 'Ρωσία', 'Σερβία',
    'Σίδνεϋ', 'Σουηδία', 'Τουρκία', 'Τσεχία', 'Φινλανδία', 'Χαβάη',
    'Χαλκιδική', 'Χανιά', 'Χίος', 'Αιθιοπία', 'Αϊτή', 'Ζαΐρ',
    'England', 'Egypt', 'Albania', 'Alexandria', 'Alexandroupoli', 'America',
    'Amsterdam', 'Andrianoupoli', 'Argostoli', 'Armenia', 'Australia', 'Austria',
    'Africa', 'Belgrade', 'Belgium', 'Venezuela', 'Berlin', 'Vienna', 'Bulgaria',
    'Brazil', 'Britain', 'Brussels', 'France', 'Germany', 'Denmark', 'Dublin',
    'Greece', 'Zakynthos', 'Zante', 'Zurich', 'Thessaloniki', 'Japan', 'Ireland',
    'Iceland', 'Spain', 'Israel', 'Italy', 'Canada', 'Corfou', 'China', 'Corea',
    'Crete', 'Croatia', 'London', 'Luxembourg', 'Moscow', 'Mykonos', 'Norway',
    'Holland', 'Hungary', 'Ukraine', 'Pakistan', 'Panama', 'Paris', 'Petersburg',
    'Portugal', 'Rome', 'Russia', 'Serbia', 'Sydney', 'Sweden', 'Turkey',
    'Finland', 'Hawaii', 'Chalkidiki', 'Chania', 'Chios', 'Aegina', 'Aegean',
    'Ethiopia', 'Haiti', 'Zaïr', 'Czech', 'Republic', 'Dumbai',
}


def clean_text(text: str) -> str:
    """Clean text from soft hyphens, invisible characters, and normalize spacing"""
    if not text:
        return ""

    # Remove soft hyphens (U+00AD) and other invisible formatting
    text = text.replace('\u00ad', '')  # soft hyphen
    text = text.replace('\u200b', '')  # zero-width space
    text = text.replace('\ufeff', '')  # zero-width no-break space

    # Fix hyphenated words split across lines (e.g., "labora- tory" -> "laboratory")
    text = re.sub(r'-\s+', '', text)

    # Fix excessive spacing issues like "work shop" from "workshop"
    text = re.sub(r'(\w+)\s+(\w{1,4})\b', lambda m: m.group(1) + m.group(2) if len(m.group(2)) <= 4 else m.group(0), text)

    # Normalize multiple spaces to single space
    text = re.sub(r'\s+', ' ', text)

    # Remove leading/trailing whitespace
    text = text.strip()

    return text


def has_greek_letters(text: str) -> bool:
    """Check if text contains Greek letters"""
    return bool(re.search(r'[Α-Ωα-ω]', text))


def is_valid_greek_word(text: str) -> bool:
    """Validate that the Greek word is valid"""
    if not text or not text.strip():
        return False

    # Must contain at least one Greek letter
    if not has_greek_letters(text):
        return False

    # Check for corrupted characters
    if '�' in text:
        return False

    return True


def is_valid_english_word(text: str) -> bool:
    """Validate that the English translation is valid"""
    if not text or not text.strip():
        return False

    # Check for corrupted characters
    if '�' in text:
        return False

    # Must contain at least some Latin letters
    if not re.search(r'[A-Za-z]', text):
        return False

    return True


def is_proper_noun(greek_text: str, english_text: str) -> bool:
    """
    Determine if this entry is a proper noun (person name, place name)
    """
    # Extract just the first word from Greek text (before comma or space)
    greek_word = re.split(r'[, ]', greek_text)[0].strip()

    # Extract first word from English
    english_word = english_text.split()[0] if english_text.split() else ""

    # Check if it's in our known proper nouns list
    if greek_word in PROPER_NOUNS or english_text in PROPER_NOUNS:
        return True

    # Check for capitalized words in both languages (strong indicator of proper noun)
    if greek_word and greek_word[0].isupper() and english_word and english_word[0].isupper():
        # Exception: nationality adjectives are OK (e.g., "Άγγλος" -> "English")
        nationality_suffixes = ['man', 'woman', 'ese', 'ian', 'ish', 'ic']
        if not any(english_text.lower().endswith(suffix) for suffix in nationality_suffixes):
            # But not if it's a demonym noun like "Άγγλος, -ίδα"
            if not re.search(r'-ίδα|-ισσα|-έζα|-ή', greek_text):
                return True

    return False


def clean_dictionary(input_file: str, output_file: str, level: str):
    """Clean an existing dictionary JSON file"""

    # Load the data
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"\n{'='*80}")
    print(f"Processing {level} - Original entries: {len(data)}")
    print(f"{'='*80}")

    cleaned_data = []
    skipped = {
        'empty_greek': [],
        'empty_english': [],
        'corrupted': [],
        'proper_nouns': []
    }

    for entry in data:
        greek = entry.get('greek', '')
        english = entry.get('english', '')

        # Clean the text
        greek_cleaned = clean_text(greek)
        english_cleaned = clean_text(english)

        # Validate
        if not is_valid_greek_word(greek_cleaned):
            skipped['empty_greek'].append({'greek': greek, 'english': english})
            continue

        if not is_valid_english_word(english_cleaned):
            skipped['empty_english'].append({'greek': greek, 'english': english})
            continue

        # Filter proper nouns
        if is_proper_noun(greek_cleaned, english_cleaned):
            skipped['proper_nouns'].append({'greek': greek_cleaned, 'english': english_cleaned})
            continue

        # Add cleaned entry
        cleaned_entry = entry.copy()
        cleaned_entry['greek'] = greek_cleaned
        cleaned_entry['english'] = english_cleaned
        cleaned_data.append(cleaned_entry)

    # Save cleaned data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, ensure_ascii=False, indent=2)

    # Save skipped entries for review
    skipped_file = output_file.replace('_clean.json', '_skipped.json')
    with open(skipped_file, 'w', encoding='utf-8') as f:
        json.dump(skipped, f, ensure_ascii=False, indent=2)

    # Print report
    print(f"\n✅ Valid entries: {len(cleaned_data)}")
    print(f"\n⚠️  Skipped:")
    print(f"   - Empty Greek: {len(skipped['empty_greek'])}")
    print(f"   - Empty English: {len(skipped['empty_english'])}")
    print(f"   - Corrupted: {len(skipped['corrupted'])}")
    print(f"   - Proper nouns: {len(skipped['proper_nouns'])}")

    total_skipped = sum(len(v) for v in skipped.values())
    if len(cleaned_data) + total_skipped > 0:
        success_rate = len(cleaned_data) / (len(cleaned_data) + total_skipped) * 100
        print(f"\n📊 Success rate: {success_rate:.1f}%")
        print(f"   Removed {total_skipped} entries ({100-success_rate:.1f}% of total)")

    # Show some examples
    if skipped['empty_greek']:
        print(f"\n❌ Sample empty Greek words (first 5):")
        for entry in skipped['empty_greek'][:5]:
            print(f"   Greek: '{entry['greek']}' | English: '{entry['english']}'")

    if skipped['proper_nouns']:
        print(f"\n🚫 Sample filtered proper nouns (first 10):")
        for entry in skipped['proper_nouns'][:10]:
            print(f"   {entry['greek']} = {entry['english']}")

    # Show sample valid entries
    print(f"\n✅ Sample valid entries (first 5):")
    for entry in cleaned_data[:5]:
        print(f"   {entry['greek']} = {entry['english']}")

    print(f"\n💾 Saved to: {output_file}")
    print(f"📋 Skipped entries saved to: {skipped_file}")

    return cleaned_data, skipped


if __name__ == "__main__":
    levels = ['A1', 'A2', 'B1', 'B2']

    print("\n" + "="*80)
    print("CLEANING EXISTING DICTIONARIES")
    print("="*80)

    all_stats = []

    for level in levels:
        input_file = f"dictionary_{level}.json"
        output_file = f"dictionary_{level}_clean.json"

        try:
            cleaned, skipped = clean_dictionary(input_file, output_file, level)

            stats = {
                'level': level,
                'valid': len(cleaned),
                'empty_greek': len(skipped['empty_greek']),
                'empty_english': len(skipped['empty_english']),
                'corrupted': len(skipped['corrupted']),
                'proper_nouns': len(skipped['proper_nouns'])
            }
            all_stats.append(stats)

        except FileNotFoundError:
            print(f"\n⚠️  File not found: {input_file}")
            continue

    # Final summary
    print("\n" + "="*80)
    print("SUMMARY ACROSS ALL LEVELS")
    print("="*80)
    print(f"\n{'Level':<10} {'Valid':<10} {'Empty GR':<12} {'Empty EN':<12} {'Proper Nouns':<15}")
    print("-" * 80)

    for stats in all_stats:
        print(f"{stats['level']:<10} {stats['valid']:<10} {stats['empty_greek']:<12} "
              f"{stats['empty_english']:<12} {stats['proper_nouns']:<15}")

    total_valid = sum(s['valid'] for s in all_stats)
    total_removed = sum(s['empty_greek'] + s['empty_english'] + s['corrupted'] + s['proper_nouns'] for s in all_stats)

    print("-" * 80)
    print(f"{'TOTAL':<10} {total_valid:<10} Total removed: {total_removed}")
    print(f"\n✨ All dictionaries cleaned successfully!")
