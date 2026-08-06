#!/usr/bin/env python3
"""
Downloads and converts free English Bible translations to our compact version format.
Sources: seven1m/open-bibles (USFX/OSIS/Zefania XML)

Available free translations:
  BSB  - Berean Standard Bible (2022)  — modern, free to distribute
  WEB  - World English Bible (2000)    — public domain, modern
  ASV  - American Standard Version (1901) — public domain, literal

NOT available (copyrighted): NIV, NLT, ESV, NKJV, NASB, CSB, GNT
"""
import urllib.request, ssl, re, json, os, xml.etree.ElementTree as ET

VERSIONS_DIR = '/Users/dhanaseeli/bible-app/bible-data/versions'
BASE_URL     = 'https://raw.githubusercontent.com/seven1m/open-bibles/master'
ctx          = ssl._create_unverified_context()

# ── Book abbreviation → numeric ID maps ────────────────────────────────────
USFX_BOOK = {
    'GEN':1,'EXO':2,'LEV':3,'NUM':4,'DEU':5,'JOS':6,'JDG':7,'RUT':8,
    '1SA':9,'2SA':10,'1KI':11,'2KI':12,'1CH':13,'2CH':14,'EZR':15,
    'NEH':16,'EST':17,'JOB':18,'PSA':19,'PRO':20,'ECC':21,'SNG':22,
    'ISA':23,'JER':24,'LAM':25,'EZK':26,'DAN':27,'HOS':28,'JOL':29,
    'AMO':30,'OBA':31,'JNA':32,'MIC':33,'NAM':34,'HAB':35,'ZEP':36,
    'HAG':37,'ZEC':38,'MAL':39,
    'MAT':40,'MRK':41,'LUK':42,'JHN':43,'ACT':44,'ROM':45,
    '1CO':46,'2CO':47,'GAL':48,'EPH':49,'PHP':50,'COL':51,
    '1TH':52,'2TH':53,'1TI':54,'2TI':55,'TIT':56,'PHM':57,
    'HEB':58,'JAS':59,'1PE':60,'2PE':61,'1JN':62,'2JN':63,
    '3JN':64,'JUD':65,'REV':66,
}
# Also handle some variant abbreviations in different XML flavours
USFX_BOOK.update({'EXO':'EXO','EXOD':2,'SONG':22,'SNG':22,'JONAH':32,
                   'JNA':32,'JONA':32,'OBA':31,'OBD':31,'OBAD':31})
USFX_BOOK = {k: v for k, v in USFX_BOOK.items() if isinstance(v, int)}

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
        return r.read().decode('utf-8')

# ── USFX parser (BSB, WEB) ──────────────────────────────────────────────────
def clean_verse_text(raw):
    # Remove footnotes <f ...>...</f>
    text = re.sub(r'<f\b[^>]*>.*?</f>', '', raw, flags=re.DOTALL)
    # Remove cross-reference paragraphs <p sfm="r" ...>...</p>
    text = re.sub(r'<p\s+sfm="r"[^>]*>.*?</p>', '', text, flags=re.DOTALL)
    # Extract text from <w s="...">word</w>
    text = re.sub(r'<w\b[^>]*>(.*?)</w>', r'\1', text, flags=re.DOTALL)
    # Remove all remaining XML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Collapse whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n+', ' ', text)
    return text.strip()

def parse_usfx(xml_text):
    """Returns {book_id: {chapter: {verse: text}}}"""
    texts = {}
    # Extract each verse: <v id="N" bcv="BOOK.CH.V" />  ... content ...  <ve />
    for m in re.finditer(
        r'<v\b[^>]*?\bbcv="([A-Z0-9]+)\.(\d+)\.(\d+)"[^>]*/>(.*?)<ve\s*/>',
        xml_text, re.DOTALL
    ):
        book_abbr, chap, verse, raw = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4)
        book_id = USFX_BOOK.get(book_abbr)
        if book_id is None:
            continue
        verse_text = clean_verse_text(raw)
        if verse_text:
            key = f"{book_id}:{chap}:{verse}"
            texts[key] = verse_text
    return texts

# ── USFX stateful parser for WEB-style (no bcv attribute) ──────────────────
def parse_usfx_stateful(xml_text):
    """Parse USFX where <v> has only id attribute; track state via <book> and <c>."""
    texts = {}
    book_id = None
    chap    = None

    # Process book blocks
    for book_m in re.finditer(r'<book id="([A-Z0-9]+)">(.*?)(?=<book\s|</usfx>)', xml_text, re.DOTALL):
        bid = USFX_BOOK.get(book_m.group(1))
        if bid is None:
            continue
        book_content = book_m.group(2)

        # Split chapters by <c id="N"/>
        parts = re.split(r'<c id="(\d+)"\s*/?>', book_content)
        # parts: [pre, ch_num, ch_content, ch_num, ch_content, ...]
        i = 1
        while i < len(parts) - 1:
            ch = int(parts[i])
            ch_content = parts[i + 1]
            # Extract verses
            for v_m in re.finditer(r'<v id="(\d+)"\s*/?>(.*?)<ve\s*/?>', ch_content, re.DOTALL):
                v = int(v_m.group(1))
                text = clean_verse_text(v_m.group(2))
                if text:
                    texts[f"{bid}:{ch}:{v}"] = text
            i += 2

    return texts

# ── Zefania XML parser (ASV) ────────────────────────────────────────────────
def parse_zefania(xml_text):
    texts = {}
    root = ET.fromstring(xml_text)
    for book_el in root.iter('BIBLEBOOK'):
        book_id = int(book_el.get('bnumber', 0))
        if not book_id:
            continue
        for ch_el in book_el.iter('CHAPTER'):
            ch = int(ch_el.get('cnumber', 0))
            if not ch:
                continue
            for v_el in ch_el.iter('VERS'):
                v = int(v_el.get('vnumber', 0))
                if not v:
                    continue
                text = (v_el.text or '').strip()
                if text:
                    texts[f"{book_id}:{ch}:{v}"] = text
    return texts

# ── OSIS parser (KJV variant) ───────────────────────────────────────────────
OSIS_BOOK = dict(USFX_BOOK)  # same abbreviations

def parse_osis(xml_text):
    texts = {}
    # Verse pattern: <verse osisID="GEN.1.1">text<note ...>note</note>more text</verse>
    # Also handles <verse sID="GEN.1.1"/> ... <verse eID="GEN.1.1"/>
    for m in re.finditer(r'<verse\b[^>]*\bosisID="([^"]+)"[^>]*>(.*?)</verse>', xml_text, re.DOTALL):
        ref, raw = m.group(1), m.group(2)
        parts = ref.split('.')
        if len(parts) != 3:
            continue
        book_abbr, chap, verse = parts[0].upper(), int(parts[1]), int(parts[2])
        book_id = OSIS_BOOK.get(book_abbr)
        if not book_id:
            continue
        # Remove notes and tags
        text = re.sub(r'<note[^>]*>.*?</note>', '', raw, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        if text:
            texts[f"{book_id}:{chap}:{verse}"] = text
    return texts

# ── Save helper ─────────────────────────────────────────────────────────────
def save_version(vid, name, short, year, copyright_text, texts):
    path = os.path.join(VERSIONS_DIR, f'{vid}.json')
    data = {"id": vid, "name": name, "short": short, "year": year,
            "copyright": copyright_text, "texts": texts}
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    size = os.path.getsize(path)
    print(f'  Saved {path} ({size//1024} KB, {len(texts)} verses)')
    # Verify John 3:16
    v = texts.get('43:3:16', '[not found]')
    print(f'  John 3:16: {v[:80]}')

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    os.makedirs(VERSIONS_DIR, exist_ok=True)

    # 1. BSB – Berean Standard Bible (USFX)
    print('\n[1/3] Downloading BSB (Berean Standard Bible)…')
    try:
        xml = fetch(f'{BASE_URL}/eng-bsb.usfx.xml')
        texts = parse_usfx(xml)
        print(f'  Parsed {len(texts)} verses')
        save_version('bsb', 'Berean Standard Bible', 'BSB', 2022,
                     'Free to use and distribute', texts)
    except Exception as e:
        print(f'  ERROR: {e}')

    # 2. WEB – World English Bible (USFX, no bcv attributes — use book/chapter state)
    print('\n[2/3] Downloading WEB (World English Bible)…')
    try:
        xml = fetch(f'{BASE_URL}/eng-web.usfx.xml')
        texts = parse_usfx_stateful(xml)
        print(f'  Parsed {len(texts)} verses')
        save_version('web', 'World English Bible', 'WEB', 2000,
                     'Public Domain', texts)
    except Exception as e:
        print(f'  ERROR: {e}')

    # 3. ASV – American Standard Version (Zefania)
    print('\n[3/3] Downloading ASV (American Standard Version)…')
    try:
        xml = fetch(f'{BASE_URL}/eng-asv.zefania.xml')
        texts = parse_zefania(xml)
        print(f'  Parsed {len(texts)} verses')
        save_version('asv', 'American Standard Version', 'ASV', 1901,
                     'Public Domain', texts)
    except Exception as e:
        print(f'  ERROR: {e}')

    print('\nDone!')

if __name__ == '__main__':
    main()
