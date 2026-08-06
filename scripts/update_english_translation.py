#!/usr/bin/env python3
"""
Downloads the Bible in Basic English (BBE) — modern, simple, public domain —
and merges its verse text into the existing english_bible.json, preserving all
Tamil metadata, book names, aliases, and structure.

BBE uses simple modern English words; perfect for non-native English readers.
"""
import json
import urllib.request
import ssl
import sys
import os
import shutil

BIBLE_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'bible-data')
ENGLISH_JSON   = os.path.join(BIBLE_DATA_DIR, 'english_bible.json')
BACKUP_JSON    = os.path.join(BIBLE_DATA_DIR, 'english_bible.kjv_backup.json')

BBE_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_bbe.json'

def download_bbe():
    print('Downloading Bible in Basic English (BBE)…')
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(BBE_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        # Handle UTF-8 BOM if present
        data = json.loads(r.read().decode('utf-8-sig'))
    print(f'  Downloaded {len(data)} books')
    return data

def build_index(bbe_data):
    """Returns {book_id_1based: {chapter_1based: {verse_1based: text}}}"""
    index = {}
    for bi, book in enumerate(bbe_data):
        ch_map = {}
        for ci, chapter in enumerate(book['chapters']):
            v_map = {}
            for vi, verse_text in enumerate(chapter):
                v_map[vi + 1] = verse_text.strip()
            ch_map[ci + 1] = v_map
        index[bi + 1] = ch_map  # book id is 1-based
    return index

def update_english_bible(bbe_index):
    print(f'Loading {ENGLISH_JSON}…')
    with open(ENGLISH_JSON, encoding='utf-8') as f:
        bible = json.load(f)

    # Back up KJV before overwriting
    if not os.path.exists(BACKUP_JSON):
        shutil.copy2(ENGLISH_JSON, BACKUP_JSON)
        print(f'  KJV backup saved → {os.path.basename(BACKUP_JSON)}')

    updated = 0
    missing = 0

    for book in bible['books']:
        book_id = book['id']
        if book_id not in bbe_index:
            print(f'  WARNING: book {book_id} ({book["name_english"]}) not in BBE')
            continue
        ch_map = bbe_index[book_id]

        for chapter in book['chapters']:
            ch_no = chapter['chapter_no']
            if ch_no not in ch_map:
                print(f'  WARNING: {book["name_english"]} ch {ch_no} not in BBE')
                continue
            v_map = ch_map[ch_no]

            for verse in chapter['verses']:
                v_no = verse['verse_no']
                if v_no in v_map and v_map[v_no]:
                    verse['text'] = v_map[v_no]
                    updated += 1
                else:
                    missing += 1

    print(f'  Updated {updated} verses ({missing} missing, kept original)')

    # Update translation label in metadata if it exists
    if 'metadata' not in bible:
        bible['metadata'] = {}
    bible['metadata']['translation'] = 'BBE'
    bible['metadata']['translation_name'] = 'Bible in Basic English'
    bible['metadata']['year'] = 1949
    bible['metadata']['public_domain'] = True

    with open(ENGLISH_JSON, 'w', encoding='utf-8') as f:
        json.dump(bible, f, ensure_ascii=False, separators=(',', ':'))

    size = os.path.getsize(ENGLISH_JSON)
    print(f'  Saved {ENGLISH_JSON} ({size/1024:.0f} KB)')

def verify(bbe_index):
    print('Verifying…')
    with open(ENGLISH_JSON, encoding='utf-8') as f:
        bible = json.load(f)
    # Check John 3:16
    for book in bible['books']:
        if book['id'] == 43:
            v = book['chapters'][2]['verses'][15]
            print(f'  John 3:16 → {v["text"][:80]}')
            break

def main():
    try:
        bbe_data = download_bbe()
    except Exception as e:
        print(f'ERROR downloading BBE: {e}', file=sys.stderr)
        sys.exit(1)

    bbe_index = build_index(bbe_data)
    update_english_bible(bbe_index)
    verify(bbe_index)
    print('\nDone! English Bible is now Bible in Basic English (BBE).')
    print('KJV backup preserved at english_bible.kjv_backup.json')

if __name__ == '__main__':
    main()
