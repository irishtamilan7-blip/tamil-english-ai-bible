const BOOK_MAP: Record<string, number> = {
  genesis:1,gen:1,exodus:2,exo:2,leviticus:3,lev:3,numbers:4,num:4,deuteronomy:5,deut:5,
  joshua:6,josh:6,judges:7,judg:7,ruth:8,
  '1samuel':9,'1sam':9,'2samuel':10,'2sam':10,
  '1kings':11,'1kgs':11,'2kings':12,'2kgs':12,
  '1chronicles':13,'1chr':13,'2chronicles':14,'2chr':14,
  ezra:15,nehemiah:16,neh:16,esther:17,est:17,job:18,
  psalms:19,psalm:19,ps:19,psa:19,
  proverbs:20,prov:20,pro:20,ecclesiastes:21,eccl:21,
  'songofsolomon':22,songs:22,song:22,sos:22,
  isaiah:23,isa:23,jeremiah:24,jer:24,lamentations:25,lam:25,
  ezekiel:26,ezek:26,daniel:27,dan:27,hosea:28,hos:28,joel:29,
  amos:30,obadiah:31,obad:31,jonah:32,jon:32,micah:33,mic:33,
  nahum:34,nah:34,habakkuk:35,hab:35,zephaniah:36,zeph:36,
  haggai:37,hag:37,zechariah:38,zech:38,malachi:39,mal:39,
  matthew:40,matt:40,mat:40,mark:41,luke:42,john:43,jn:43,
  acts:44,romans:45,rom:45,
  '1corinthians':46,'1cor':46,'2corinthians':47,'2cor':47,
  galatians:48,gal:48,ephesians:49,eph:49,philippians:50,phil:50,
  colossians:51,col:51,'1thessalonians':52,'1thess':52,'2thessalonians':53,'2thess':53,
  '1timothy':54,'1tim':54,'2timothy':55,'2tim':55,titus:56,tit:56,
  philemon:57,phlm:57,hebrews:58,heb:58,james:59,jas:59,
  '1peter':60,'1pet':60,'2peter':61,'2pet':61,
  '1john':62,'1jn':62,'2john':63,'2jn':63,'3john':64,'3jn':64,
  jude:65,revelation:66,rev:66,
}

export function parseVerseRef(q: string): { bookId: number; chapter: number; verse?: number } | null {
  // Normalize: "1 John 3:16" → match book + chapter + verse
  const norm = q.trim().toLowerCase()
  const m = norm.match(/^(\d?\s?[a-z]+(?:\s[a-z]+)?)\s+(\d+)[:\s](\d+)$/)
    ?? norm.match(/^(\d?\s?[a-z]+(?:\s[a-z]+)?)\s+(\d+)$/)
  if (!m) return null
  const bookKey = m[1].replace(/\s/g, '')
  const bookId = BOOK_MAP[bookKey]
  if (!bookId) return null
  return {
    bookId,
    chapter: parseInt(m[2]),
    verse: m[3] ? parseInt(m[3]) : undefined,
  }
}
