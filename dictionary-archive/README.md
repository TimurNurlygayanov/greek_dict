# Dictionary Archive

This folder contains all the dictionary parsing artifacts and migration history.

## Directory Structure

### `/scripts/`
- `parse_words_improved.py` - The main parser that extracts words from PDFs (use this for future updates)
- `parse_words.py` - Old parser (kept for reference)
- `migrate_production.sh` - Production migration script
- `reset_all_user_data.sh` - User data reset script

### `/reports/`
- `MIGRATION_GUIDE.md` - Complete documentation of the migration process
- `quality_report_A1.txt` through `quality_report_B2.txt` - Quality analysis for each level

### `/skipped/`
- `dictionary_[LEVEL]_skipped_new.json` - Entries that were filtered out during parsing
  - Empty Greek words
  - Empty English translations
  - Corrupted data
  - Proper nouns (people/place names)

### `/backups/`
- `backup_20251109_102739/` - Old dictionary versions before migration
- `user_data_backup_20251109_103001/` - User data backup before reset

### Root Files
- `dictionary_A1_parsed.json` through `dictionary_B2_parsed.json` - Clean parsed dictionaries (identical to production versions)

## Production Files

The following files are in the root directory and are actively used by the application:
- `dictionary_A1.json` (1,340 entries)
- `dictionary_A2.json` (1,543 entries)
- `dictionary_B1.json` (4,018 entries)
- `dictionary_B2.json` (4,224 entries)

Total: 11,125 clean dictionary entries

## Re-parsing Instructions

To re-parse from PDFs in the future:

```bash
cd /Users/playrix/greek_dict
source .venv/bin/activate
python3 dictionary-archive/scripts/parse_words_improved.py
```

This will generate new `dictionary_[LEVEL]_parsed.json` files with quality reports.
