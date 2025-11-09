import fitz  # PyMuPDF
import json
import re
import unicodedata

words_level = 'B1'


def normalize_greek(text: str) -> str:
    """Удаляет ударения и диакритики из греческого текста для поиска"""
    normalized = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def extract_pos(greek_part: str):
    """Извлекает часть речи, если есть [adv.], [n.], [v.], [place name] и т.п."""
    match = re.search(r"\[([^\]]+)\]", greek_part)
    if match:
        pos = match.group(1).strip()
        greek_clean = re.sub(r"\[[^\]]+\]", "", greek_part).strip()
        return greek_clean, pos
    return greek_part.strip(), ""  # если не найдено — вернуть пустую строку


doc = fitz.open(f"words_{words_level}.pdf")
lines = []

# Собираем все строки со всех страниц
for page in doc:
    text = page.get_text("text")
    if text:
        lines.extend(text.split("\n"))

data = []
i = 0
while i < len(lines):
    line = lines[i].strip()

    if "=" in line:
        greek_raw, english_raw = line.split("=", 1)
        greek_raw = greek_raw.strip()
        english_raw = english_raw.strip()

        # Извлекаем часть речи и нормализуем слово
        greek_display, pos = extract_pos(greek_raw)
        greek_normalized = normalize_greek(greek_display)

        # Если после "=" ничего нет — перевод на следующих строках
        if not english_raw:
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
            # Проверяем продолжение перевода на следующих строках
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

        # Пропуск явно мусорных коротких строк
        if ', ' in greek_raw:
            words = greek_raw.split(', ')
            if len(words[0].strip()) == 1 and len(words[1].strip()) == 1:
                i += 1
                continue

        data.append({
            "greek": greek_display,               # оригинал (с ударением)
            "greek_normalized": greek_normalized, # без ударений — для поиска
            "pos": pos,                           # часть речи (или "")
            "english": english_raw
        })

    i += 1

# Сохраняем результат
with open(f"dictionary_{words_level}.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"✅ Extracted {len(data)} entries.")
