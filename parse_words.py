import fitz  # PyMuPDF
import json

doc = fitz.open("dict.pdf")
data = []

for page in doc:
    text = page.get_text("text")  # Можно попробовать "blocks" или "words"
    for line in text.split("\n"):
        if "=" in line:
            greek, english = line.split("=", 1)

            if ', ' in greek:
                words = greek.split(', ')
                if len(words[0].strip()) == 1 and len(words[1].strip()) == 1:
                    continue
                else: print(words)

            data.append({
                "greek": greek.strip(),
                "english": english.strip()
            })

with open("dictionary.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✅ Extracted", len(data), "entries.")
