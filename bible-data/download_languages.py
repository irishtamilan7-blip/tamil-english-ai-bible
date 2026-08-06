#!/usr/bin/env python3
"""
Download Bible translations from getbible.net and convert to app format.
Run from: /Users/dhanaseeli/bible-app/bible-data/
"""
import urllib.request, ssl, json, os, time

ctx = ssl._create_unverified_context()

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENGLISH_BIBLE_PATH = os.path.join(SCRIPT_DIR, 'english_bible.json')

# Load English Bible for book metadata (id, testament, name_english, aliases)
with open(ENGLISH_BIBLE_PATH) as f:
    eng_data = json.load(f)

# Build book metadata index by book id
BOOK_META = {}
for b in eng_data['books']:
    BOOK_META[b['id']] = {
        'id': b['id'],
        'name_english': b['name_english'],
        'testament': b['testament'],
        'aliases_english': b.get('aliases_english', []),
    }

# One translation per language, chosen for quality/completeness
# (abbrev, language_key, native_name, direction)
LANGUAGES = [
    ('mal1910',         'malayalam',            'മലയാളം',           'ltr'),
    ('arabicsv',        'arabic',               'عربي',              'rtl'),
    ('cus',             'chinese_simplified',   '中文 (简体)',         'ltr'),
    ('cut',             'chinese_traditional',  '中文 (繁體)',         'ltr'),
    ('korean',          'korean',               '한국어',             'ltr'),
    ('japkougo',        'japanese',             '日本語',             'ltr'),
    ('thai',            'thai',                 'ภาษาไทย',           'ltr'),
    ('vietnamese',      'vietnamese',           'Tiếng Việt',        'ltr'),
    ('tagalog',         'tagalog',              'Tagalog',           'ltr'),
    ('synodal',         'russian',              'Русский',           'ltr'),
    ('valera',          'spanish',              'Español',           'ltr'),
    ('ls1910',          'french',               'Français',          'ltr'),
    ('elberfelder',     'german',               'Deutsch',           'ltr'),
    ('almeida',         'portuguese',           'Português',         'ltr'),
    ('swahili',         'swahili',              'Kiswahili',         'ltr'),
    ('turkish',         'turkish',              'Türkçe',            'ltr'),
    ('monkjv',          'mongolian',            'Монгол',            'ltr'),
    ('aov',             'afrikaans',            'Afrikaans',         'ltr'),
    ('alb',             'albanian',             'Shqip',             'ltr'),
    ('easternarmenian', 'armenian',             'Հայերեն',           'ltr'),
    ('croatia',         'croatian',             'Hrvatski',          'ltr'),
    ('bkr',             'czech',                'Čeština',           'ltr'),
    ('danish',          'danish',               'Dansk',             'ltr'),
    ('statenvertaling', 'dutch',                'Nederlands',        'ltr'),
    ('estonian',        'estonian',             'Eesti',             'ltr'),
    ('pyharaamattu1933','finnish',              'Suomi',             'ltr'),
    ('karoli',          'hungarian',            'Magyar',            'ltr'),
    ('riveduta',        'italian',              'Italiano',          'ltr'),
    ('latvian',         'latvian',              'Latviešu',          'ltr'),
    ('lithuanian',      'lithuanian',           'Lietuvių',          'ltr'),
    ('mg1865',          'malagasy',             'Malagasy',          'ltr'),
    ('maori',           'maori',                'Māori',             'ltr'),
    ('bibelselskap',    'norwegian',            'Norsk',             'ltr'),
    ('polgdanska',      'polish',               'Polski',            'ltr'),
    ('cornilescu',      'romanian',             'Română',            'ltr'),
    ('srkdekavski',     'serbian',              'Српски',            'ltr'),
    ('shona',           'shona',                'Shona',             'ltr'),
    ('swedish',         'swedish',              'Svenska',           'ltr'),
    ('ukrogienko',      'ukrainian',            'Українська',        'ltr'),
    ('judson',          'burmese',              'မြန်မာ',            'ltr'),
    ('moderngreek',     'greek',                'Ελληνικά',          'ltr'),
    ('modernhebrew',    'hebrew',               'עברית',             'rtl'),
    ('esperanto',       'esperanto',            'Esperanto',         'ltr'),
    ('dari',            'dari',                 'دری',               'rtl'),
]

def fetch_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'BibleApp/1.0'})
            with urllib.request.urlopen(req, timeout=60, context=ctx) as r:
                return json.loads(r.read())
        except Exception as e:
            if attempt < retries - 1:
                print(f'  retry {attempt+1}: {e}')
                time.sleep(2)
            else:
                raise

def convert_to_app_format(raw, lang_key, native_name, abbrev, direction):
    """Convert getbible.net full Bible JSON to app format."""
    raw_books = raw.get('books', [])
    books = []
    for raw_book in raw_books:
        book_id = raw_book['nr']
        meta = BOOK_META.get(book_id)
        if not meta:
            print(f'  WARNING: no metadata for book id {book_id}')
            continue

        chapters = []
        for raw_chap in raw_book.get('chapters', []):
            verses = []
            for raw_verse in raw_chap.get('verses', []):
                verses.append({
                    'verse_no': raw_verse['verse'],
                    'text': raw_verse['text'].strip(),
                })
            chapters.append({
                'chapter_no': raw_chap['chapter'],
                'verses': verses,
            })

        book = {
            'id': book_id,
            'name_english': meta['name_english'],
            f'name_{lang_key}': raw_book['name'],
            'testament': meta['testament'],
            'aliases_english': meta['aliases_english'],
            f'aliases_{lang_key}': [],
            'chapters': chapters,
        }
        books.append(book)

    return {
        'metadata': {
            'language': lang_key,
            'native_name': native_name,
            'abbreviation': abbrev,
            'direction': direction,
            'source': 'getbible.net',
        },
        'books': books,
    }

def main():
    out_path_map = {}  # lang_key -> output_file path

    for abbrev, lang_key, native_name, direction in LANGUAGES:
        out_path = os.path.join(SCRIPT_DIR, f'{lang_key}_bible.json')
        if os.path.exists(out_path):
            print(f'⏭  {lang_key} ({abbrev}) — already exists, skipping')
            out_path_map[lang_key] = out_path
            continue

        print(f'⬇  Downloading {lang_key} ({abbrev}) — {native_name}')
        url = f'https://api.getbible.net/v2/{abbrev}.json'
        try:
            raw = fetch_json(url)
            converted = convert_to_app_format(raw, lang_key, native_name, abbrev, direction)
            with open(out_path, 'w', encoding='utf-8') as f:
                json.dump(converted, f, ensure_ascii=False, separators=(',', ':'))
            size_kb = os.path.getsize(out_path) // 1024
            print(f'   ✅ Saved {lang_key}_bible.json ({size_kb} KB, {len(converted["books"])} books)')
            out_path_map[lang_key] = out_path
        except Exception as e:
            print(f'   ❌ Failed: {e}')
        time.sleep(0.5)  # be polite to the API

    # Write language config for the app
    config_path = os.path.join(SCRIPT_DIR, 'language_config.json')
    config = [
        {'key': 'english', 'native_name': 'English', 'direction': 'ltr', 'file': 'english_bible.json'},
        {'key': 'tamil', 'native_name': 'தமிழ்', 'direction': 'ltr', 'file': 'tamil_bible.json'},
    ]
    for abbrev, lang_key, native_name, direction in LANGUAGES:
        fname = f'{lang_key}_bible.json'
        if os.path.exists(os.path.join(SCRIPT_DIR, fname)):
            config.append({'key': lang_key, 'native_name': native_name, 'direction': direction, 'file': fname})
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    print(f'\n✅ language_config.json written with {len(config)} languages')

if __name__ == '__main__':
    main()
