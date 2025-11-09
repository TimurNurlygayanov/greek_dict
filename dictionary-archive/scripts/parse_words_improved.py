#!/usr/bin/env python3
"""
Improved Greek Dictionary Parser
Handles multi-line splits, filters proper nouns, validates data quality
"""

import fitz  # PyMuPDF
import json
import re
import unicodedata
from typing import List, Dict, Tuple, Optional

# Configuration
WORDS_LEVEL = 'A1'  # Change this to A1, A2, B1, B2

# Common Greek first names and place names to filter out
PROPER_NOUNS = {
    # People names
    'Αγγελική', 'Άγγελος', 'Αθανασία', 'Αθηνά', 'Αιμιλία', 'Αλεξάνδρα',
    'Αλέξης', 'Αλεξία', 'Αλίκη', 'Άννα', 'Ανέστης', 'Αναστασία', 'Αντιγόνη',
    'Αντρέας', 'Αντώνης', 'Απόστολος', 'Αποστόλης', 'Βασίλης', 'Βασιλική',
    'Βάσω', 'Γιάννης', 'Γιώργος', 'Γρηγόρης', 'Δήμητρα', 'Δημήτρης',
    'Ηρακλής', 'Παύλος', 'Πέτρος', 'Φίλιππος',
    # English names
    'Angelica', 'Angelo', 'Alice', 'Anna', 'Alexandra', 'Alex', 'Alexia',
    'Andrew', 'Anthony', 'Apostolos', 'Athanassia', 'Athina', 'Emilia',
    'Gregory', 'Jim', 'Dimitris', 'Dimitra', 'John', 'George', 'Paul',
    'Peter', 'Philip', 'Vassilis', 'Vassiliki', 'Vasso', 'Hercules',
    # Places (countries, cities)
    'Αγγλία', 'Αίγινα', 'Αίγυπτος', 'Αθηνά', 'Αλβανία', 'Αλεξάνδρεια',
    'Αλεξανδρούπολη', 'Αμερική', 'Άμστερνταμ', 'Ανδριανούπολη', 'Αργοστόλι',
    'Αρμενία', 'Αυστραλία', 'Αυστρία', 'Αφρική', 'Βελιγράδι', 'Βελγίο',
    'Βενεζουέλα', 'Βερολίνο', 'Βιέννη', 'Βουλγαρία', 'Βραζιλία', 'Βρετανία',
    'Βρυξέλλες', 'Γαλλία', 'Γερμανία', 'Δανία', 'Δουβλίνο', 'Ελλάδα',
    'Ζάκυνθος', 'Ζυρίχη', 'Θεσσαλονίκη', 'Ιαπωνία', 'Ιρλανδία', 'Ισλανδία',
    'Ισπανία', 'Ισραήλ', 'Ιταλία', 'Καναδάς', 'Κέρκυρα', 'Κίνα', 'Κορέα',
    'Κρήτη', 'Κροατία', 'Λονδίνο', 'Λουξεμβούργο', 'Μόσχα', 'Μύκονος',
    'Νορβηγία', 'Ολλανδία', 'Ουγγαρία', 'Ουκρανία', 'Πακιστάν', 'Παναμάς',
    'Παρίσι', 'Πετρούπολη', 'Πορτογαλία', 'Ρώμη', 'Ρωσία', 'Σερβία',
    'Σίδνεϋ', 'Σουηδία', 'Τουρκία', 'Τσεχία', 'Φινλανδία', 'Χαβάη',
    'Χαλκιδική', 'Χανιά', 'Χίος',
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
    'USA', 'Saudi', 'Arabia', 'Ethiopia', 'Haiti', 'New', 'Zealand', 'Arctic',
    'Czech', 'Republic', 'Mount', 'Olympus', 'Eiffel', 'Tower', 'Thames', 'Danube'
}


def normalize_greek(text: str) -> str:
    """Remove accents and diacritics from Greek text for search"""
    normalized = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def clean_text(text: str) -> str:
    """Clean text from soft hyphens, invisible characters, and normalize spacing"""
    # Remove soft hyphens (U+00AD) and other invisible formatting
    text = text.replace('\u00ad', '')  # soft hyphen
    text = text.replace('\u200b', '')  # zero-width space
    text = text.replace('\ufeff', '')  # zero-width no-break space

    # Fix hyphenated words split across lines (e.g., "labora- tory" -> "laboratory")
    text = re.sub(r'-\s+', '', text)

    # Normalize multiple spaces to single space
    text = re.sub(r'\s+', ' ', text)

    # Remove leading/trailing whitespace
    text = text.strip()

    return text


def has_greek_letters(text: str) -> bool:
    """Check if text contains Greek letters"""
    return bool(re.search(r'[Α-Ωα-ω]', text))


def is_valid_greek_word(text: str) -> bool:
    """Validate that the Greek word is valid (contains Greek letters, not empty)"""
    if not text or not text.strip():
        return False

    # Must contain at least one Greek letter
    if not has_greek_letters(text):
        return False

    # Check for corrupted characters (Unicode replacement characters, excessive special chars)
    if '�' in text or text.count('�') > 0:
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
    that should be filtered out from a dictionary
    """
    # Extract just the first word from Greek text (before comma)
    greek_word = greek_text.split(',')[0].strip()

    # Check if it's in our known proper nouns list
    if greek_word in PROPER_NOUNS or english_text in PROPER_NOUNS:
        return True

    # Check for common patterns indicating proper nouns
    # Words that are capitalized in both Greek and English (not at sentence start)
    if greek_word and greek_word[0].isupper():
        # Check if English is also capitalized (name/place indicator)
        english_word = english_text.split()[0] if english_text.split() else ""
        if english_word and english_word[0].isupper():
            # Common exceptions: adjectives from countries are OK
            if not any(suffix in english_text.lower() for suffix in ['man', 'woman', 'ese', 'ian', 'ish', 'ic']):
                return True

    return False


def extract_pos(greek_part: str) -> Tuple[str, str]:
    """Extract part of speech if present: [adv.], [n.], [v.], etc."""
    match = re.search(r"\[([^\]]+)\]", greek_part)
    if match:
        pos = match.group(1).strip()
        greek_clean = re.sub(r"\[[^\]]+\]", "", greek_part).strip()
        return greek_clean, pos
    return greek_part.strip(), ""


def parse_pdf(level: str) -> List[Dict]:
    """Parse PDF and extract dictionary entries with quality validation"""

    pdf_path = f"words_{level}.pdf"
    doc = fitz.open(pdf_path)
    lines = []

    # Collect all lines from all pages
    for page in doc:
        text = page.get_text("text")
        if text:
            lines.extend(text.split("\n"))

    data = []
    skipped_entries = {
        'empty_greek': [],
        'empty_english': [],
        'corrupted': [],
        'proper_nouns': []
    }

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        if "=" in line:
            greek_raw, english_raw = line.split("=", 1)
            greek_raw = greek_raw.strip()
            english_raw = english_raw.strip()

            # Handle multi-line translations
            if not english_raw:
                # Translation is on following lines
                i += 1
                translation_lines = []
                while i < len(lines):
                    next_line = lines[i].strip()
                    if "=" in next_line or not next_line:
                        i -= 1
                        break
                    translation_lines.append(next_line)
                    i += 1
                english_raw = " ".join(translation_lines).strip()
            else:
                # Check if translation continues on next lines
                i += 1
                continuation = []
                while i < len(lines):
                    next_line = lines[i].strip()
                    if "=" in next_line or not next_line:
                        i -= 1
                        break
                    continuation.append(next_line)
                    i += 1
                if continuation:
                    english_raw += " " + " ".join(continuation)

            # Clean the text
            greek_raw = clean_text(greek_raw)
            english_raw = clean_text(english_raw)

            # Extract part of speech
            greek_display, pos = extract_pos(greek_raw)
            greek_normalized = normalize_greek(greek_display)

            # Quality validation
            if not is_valid_greek_word(greek_display):
                skipped_entries['empty_greek'].append({
                    'greek': greek_display,
                    'english': english_raw
                })
                i += 1
                continue

            if not is_valid_english_word(english_raw):
                skipped_entries['empty_english'].append({
                    'greek': greek_display,
                    'english': english_raw
                })
                i += 1
                continue

            # Filter out proper nouns (names, places)
            if is_proper_noun(greek_display, english_raw):
                skipped_entries['proper_nouns'].append({
                    'greek': greek_display,
                    'english': english_raw
                })
                i += 1
                continue

            # Add valid entry
            data.append({
                "greek": greek_display,
                "greek_normalized": greek_normalized,
                "pos": pos,
                "english": english_raw
            })

        i += 1

    return data, skipped_entries


def generate_quality_report(data: List[Dict], skipped: Dict, level: str):
    """Generate a quality report for manual review"""

    report = []
    report.append(f"=" * 80)
    report.append(f"QUALITY REPORT FOR LEVEL {level}")
    report.append(f"=" * 80)
    report.append(f"\nTotal valid entries: {len(data)}")
    report.append(f"\nSkipped entries breakdown:")
    report.append(f"  - Empty Greek words: {len(skipped['empty_greek'])}")
    report.append(f"  - Empty English translations: {len(skipped['empty_english'])}")
    report.append(f"  - Corrupted data: {len(skipped['corrupted'])}")
    report.append(f"  - Proper nouns (filtered): {len(skipped['proper_nouns'])}")

    total_skipped = sum(len(v) for v in skipped.values())
    report.append(f"\nTotal skipped: {total_skipped}")
    report.append(f"Success rate: {len(data)/(len(data)+total_skipped)*100:.1f}%")

    # Show examples of skipped entries
    if skipped['empty_greek']:
        report.append(f"\n\nEmpty Greek words (first 10):")
        for entry in skipped['empty_greek'][:10]:
            report.append(f"  Greek: '{entry['greek']}' | English: '{entry['english']}'")

    if skipped['proper_nouns']:
        report.append(f"\n\nFiltered proper nouns (first 20):")
        for entry in skipped['proper_nouns'][:20]:
            report.append(f"  {entry['greek']} = {entry['english']}")

    # Sample valid entries
    report.append(f"\n\nSample valid entries (first 10):")
    for entry in data[:10]:
        report.append(f"  {entry['greek']} = {entry['english']}")

    report.append(f"\n" + "=" * 80)

    return "\n".join(report)


if __name__ == "__main__":
    levels = ['A1', 'A2', 'B1', 'B2']

    print("\n" + "="*80)
    print("PARSING ALL GREEK DICTIONARIES FROM PDF")
    print("="*80)

    all_stats = []

    for level in levels:
        print(f"\n{'='*80}")
        print(f"Parsing level {level}...")
        print(f"{'='*80}")

        # Parse the PDF
        data, skipped_entries = parse_pdf(level)

        # Save the cleaned dictionary
        output_file = f"dictionary_{level}_parsed.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # Save skipped entries for review
        skipped_file = f"dictionary_{level}_skipped_new.json"
        with open(skipped_file, "w", encoding="utf-8") as f:
            json.dump(skipped_entries, f, ensure_ascii=False, indent=2)

        # Generate and save quality report
        report = generate_quality_report(data, skipped_entries, level)
        report_file = f"quality_report_{level}.txt"
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(report)

        # Print summary
        print(report)
        print(f"\n✅ Saved {len(data)} clean entries to {output_file}")
        print(f"📄 Quality report saved to {report_file}")
        print(f"⚠️  Skipped entries saved to {skipped_file} for review")

        # Collect stats
        all_stats.append({
            'level': level,
            'valid': len(data),
            'empty_greek': len(skipped_entries['empty_greek']),
            'empty_english': len(skipped_entries['empty_english']),
            'corrupted': len(skipped_entries['corrupted']),
            'proper_nouns': len(skipped_entries['proper_nouns'])
        })

    # Final summary
    print("\n" + "="*80)
    print("FINAL SUMMARY - ALL LEVELS")
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
    print(f"\n✨ All dictionaries parsed successfully!")
