import { useState, useRef, useEffect } from 'react'
import { Mic, X, Search, CheckCircle2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { aiApi, bibleApi } from '../utils/api'
import { useAppStore } from '../store/useAppStore'
import chapterCache from '../utils/chapterCache'

// ── Book lookup (key = lowercase, no spaces/symbols) ────────────────────────
const BOOK_MAP: Record<string, number> = {
  // Genesis
  genesis:1,gen:1,gn:1,genisis:1,geneses:1,genasis:1,
  // Exodus
  exodus:2,exo:2,ex:2,exdus:2,
  // Leviticus
  leviticus:3,lev:3,levi:3,leviticus3:3,
  // Numbers
  numbers:4,num:4,numb:4,
  // Deuteronomy
  deuteronomy:5,deu:5,deut:5,dt:5,deutronomy:5,dueteronomy:5,dueternomy:5,
  // Joshua
  joshua:6,jos:6,josh:6,josua:6,
  // Judges
  judges:7,jdg:7,judg:7,judge:7,
  // Ruth
  ruth:8,rut:8,
  // 1 Samuel
  '1samuel':9,'1sam':9,'1sa':9,'firstsamuel':9,'isamuel':9,
  // 2 Samuel
  '2samuel':10,'2sam':10,'2sa':10,'secondsamuel':10,'iisamuel':10,
  // 1 Kings
  '1kings':11,'1ki':11,'1kgs':11,'firstkings':11,'ikings':11,
  // 2 Kings
  '2kings':12,'2ki':12,'2kgs':12,'secondkings':12,'iikings':12,
  // 1 Chronicles
  '1chronicles':13,'1chr':13,'1ch':13,'firstchronicles':13,
  // 2 Chronicles
  '2chronicles':14,'2chr':14,'2ch':14,'secondchronicles':14,
  // Ezra
  ezra:15,ezr:15,
  // Nehemiah
  nehemiah:16,neh:16,nehimiah:16,nehamiah:16,
  // Esther
  esther:17,est:17,ester:17,
  // Job
  job:18,
  // Psalms
  psalms:19,psalm:19,psa:19,ps:19,pslams:19,salms:19,sams:19,
  // Proverbs
  proverbs:20,pro:20,prv:20,prov:20,proverb:20,provers:20,
  // Ecclesiastes
  ecclesiastes:21,ecc:21,eccles:21,ecclesiast:21,
  // Song of Solomon
  songofsolomon:22,songofsongs:22,sol:22,sos:22,songs:22,song:22,
  // Isaiah
  isaiah:23,isa:23,isaias:23,isaia:23,esaiah:23,
  // Jeremiah
  jeremiah:24,jer:24,jerimiah:24,jeramiah:24,
  // Lamentations
  lamentations:25,lam:25,lamentation:25,
  // Ezekiel
  ezekiel:26,eze:26,ezek:26,
  // Daniel
  daniel:27,dan:27,
  // Hosea
  hosea:28,hos:28,
  // Joel
  joel:29,joe:29,
  // Amos
  amos:30,amo:30,
  // Obadiah
  obadiah:31,oba:31,
  // Jonah
  jonah:32,jon:32,jona:32,
  // Micah
  micah:33,mic:33,mica:33,
  // Nahum
  nahum:34,nah:34,
  // Habakkuk
  habakkuk:35,hab:35,habakuk:35,habacuc:35,habakkuuk:35,
  // Zephaniah
  zephaniah:36,zep:36,zeph:36,zephania:36,
  // Haggai
  haggai:37,hag:37,hagai:37,
  // Zechariah
  zechariah:38,zec:38,zech:38,zachariah:38,zacharias:38,
  // Malachi
  malachi:39,mal:39,malki:39,
  // Matthew
  matthew:40,mat:40,mt:40,mathew:40,matheu:40,
  // Mark
  mark:41,mar:41,mk:41,
  // Luke
  luke:42,luk:42,lk:42,
  // John (NT) — note: same as jonah prefix so we handle carefully
  john:43,joh:43,jn:43,
  // Acts
  acts:44,act:44,
  // Romans
  romans:45,rom:45,roman:45,
  // 1 Corinthians
  '1corinthians':46,'1cor':46,'1co':46,'firstcorinthians':46,'icorinthians':46,
  // 2 Corinthians
  '2corinthians':47,'2cor':47,'2co':47,'secondcorinthians':47,'iicorinthians':47,
  // Galatians
  galatians:48,gal:48,galations:48,
  // Ephesians
  ephesians:49,eph:49,ephasians:49,efesians:49,efeshians:49,ephesian:49,
  // Philippians
  philippians:50,phi:50,php:50,phil:50,philipians:50,phillipians:50,filipians:50,
  // Colossians
  colossians:51,col:51,colosians:51,
  // 1 Thessalonians
  '1thessalonians':52,'1thes':52,'1th':52,'firstthessalonians':52,
  // 2 Thessalonians
  '2thessalonians':53,'2thes':53,'2th':53,'secondthessalonians':53,
  // 1 Timothy
  '1timothy':54,'1tim':54,'1ti':54,'firsttimothy':54,'itimothy':54,
  // 2 Timothy
  '2timothy':55,'2tim':55,'2ti':55,'secondtimothy':55,'iitimothy':55,
  // Titus
  titus:56,tit:56,
  // Philemon
  philemon:57,phm:57,
  // Hebrews
  hebrews:58,heb:58,hebrew:58,
  // James
  james:59,jas:59,jam:59,
  // 1 Peter
  '1peter':60,'1pet':60,'1pe':60,'firstpeter':60,
  // 2 Peter
  '2peter':61,'2pet':61,'2pe':61,'secondpeter':61,
  // 1 John (NT)
  '1john':62,'1jo':62,'1jn':62,'firstjohn':62,
  // 2 John
  '2john':63,'2jo':63,'2jn':63,'secondjohn':63,
  // 3 John
  '3john':64,'3jo':64,'3jn':64,'thirdjohn':64,
  // Jude
  jude:65,jud:65,
  // Revelation
  revelation:66,rev:66,revelations:66,revilation:66,revealation:66,apocalypse:66,

  // ── Tamil phonetic aliases (Tanglish / en-IN speech recognition) ──────────
  // OT
  aathiyagamam:1,aadhiyagamam:1,aadiyagamam:1,                      // Genesis
  yaathiragamam:2,yathiragamam:2,yaatharagamam:2,                    // Exodus
  leviaragamam:3,leviyaragamam:3,                                    // Leviticus
  ennaagamam:4,ennagamam:4,                                          // Numbers
  ubagamam:5,upagamam:5,                                             // Deuteronomy
  yoshuva:6,yosuva:6,joshuva:6,yosua:6,                             // Joshua
  niyayadhipathigal:7,niyayadhibathigal:7,                           // Judges
  yobu:18,yob:18,                                                    // Job
  sangeetham:19,sankeetham:19,sangitham:19,sangeethagal:19,          // Psalms
  neethimozhigal:20,nethimozhi:20,neethimozhi:20,                    // Proverbs
  pirasangi:21,prasangi:21,birasangi:21,                             // Ecclesiastes
  unnathappaatu:22,unnathapaatu:22,unnathapattu:22,                  // Song of Solomon
  esaaya:23,yesaaya:23,esaya:23,                                     // Isaiah
  yeremiya:24,eremiya:24,                                            // Jeremiah
  pulambal:25,                                                        // Lamentations
  esekiyel:26,yesekiyel:26,                                          // Ezekiel
  thaaniyel:27,daniyel:27,dhaniyel:27,thaaniyal:27,                 // Daniel
  osiya:28,hosiya:28,                                                // Hosea
  yovael:29,yovel:29,                                                // Joel
  obadhiya:31,obathiya:31,                                           // Obadiah
  yona:32,                                                           // Jonah (Tamil: யோனா)
  meeka:33,meegaa:33,                                                // Micah
  naagum:34,nakum:34,                                                // Nahum
  aabakuk:35,                                                        // Habakkuk
  sepphaniya:36,seppaniya:36,                                        // Zephaniah
  aagaai:37,agaai:37,                                                // Haggai
  sakariya:38,zakariya:38,                                           // Zechariah
  malkiya:39,malakiya:39,                                            // Malachi
  '1samuvel':9,'1samuvael':9,                                        // 1 Samuel
  '2samuvel':10,'2samuvael':10,                                      // 2 Samuel
  '1irajaakkal':11,'1rajaakkal':11,'1rajangal':11,                   // 1 Kings
  '2irajaakkal':12,'2rajaakkal':12,'2rajangal':12,                   // 2 Kings
  '1naalagamam':13,'1nallagamam':13,                                 // 1 Chronicles
  '2naalagamam':14,'2nallagamam':14,                                 // 2 Chronicles
  nekemiya:16,                                                       // Nehemiah
  estar:17,                                                          // Esther
  // NT
  maththeyou:40,mathayu:40,matheyou:40,maththayu:40,                // Matthew
  maarkku:41,markku:41,marku:41,maarku:41,                          // Mark
  looka:42,lukaa:42,lookaa:42,                                       // Luke
  yovaan:43,yovan:43,yokan:43,johun:43,                             // John
  appoosthalar:44,appoostalar:44,appusthalar:44,apoosthalar:44,     // Acts
  uromeyar:45,romayar:45,romaiyar:45,                               // Romans
  '1korinthiyar':46,'1korindiyar':46,                                // 1 Corinthians
  '2korinthiyar':47,'2korindiyar':47,                                // 2 Corinthians
  kalaththiyar:48,galathiyar:48,kalatthiyar:48,                     // Galatians
  yepesiyar:49,ephesiyar:49,ebesiyar:49,                            // Ephesians
  pilippiyar:50,philipiyar:50,phillipiyar:50,                       // Philippians
  koloseyar:51,                                                      // Colossians
  '1thesalonikeyar':52,'1thesalonikayar':52,                        // 1 Thessalonians
  '2thesalonikeyar':53,                                              // 2 Thessalonians
  '1thimotheyou':54,'1theemoththeyou':54,                           // 1 Timothy
  '2thimotheyou':55,'2theemoththeyou':55,                           // 2 Timothy
  theethu:56,teethu:56,                                             // Titus
  pilemon:57,                                                        // Philemon
  yepireyar:58,epireyar:58,ebireyar:58,                            // Hebrews
  yaakkobu:59,yakobu:59,yaakkopu:59,                               // James
  '1pethuru':60,'1peduru':60,                                       // 1 Peter
  '2pethuru':61,'2peduru':61,                                       // 2 Peter
  '1yovaan':62,'1yovan':62,                                         // 1 John
  '2yovaan':63,'2yovan':63,                                         // 2 John
  '3yovaan':64,'3yovan':64,                                         // 3 John
  yooda:65,yuda:65,juda:65,                                         // Jude
  velippaduthal:66,velippaduththal:66,velippadutthal:66,            // Revelation
}

const BOOK_NAMES: Record<number, string> = {
  1:'Genesis',2:'Exodus',3:'Leviticus',4:'Numbers',5:'Deuteronomy',
  6:'Joshua',7:'Judges',8:'Ruth',9:'1 Samuel',10:'2 Samuel',
  11:'1 Kings',12:'2 Kings',13:'1 Chronicles',14:'2 Chronicles',15:'Ezra',
  16:'Nehemiah',17:'Esther',18:'Job',19:'Psalms',20:'Proverbs',
  21:'Ecclesiastes',22:'Song of Solomon',23:'Isaiah',24:'Jeremiah',25:'Lamentations',
  26:'Ezekiel',27:'Daniel',28:'Hosea',29:'Joel',30:'Amos',
  31:'Obadiah',32:'Jonah',33:'Micah',34:'Nahum',35:'Habakkuk',
  36:'Zephaniah',37:'Haggai',38:'Zechariah',39:'Malachi',
  40:'Matthew',41:'Mark',42:'Luke',43:'John',44:'Acts',
  45:'Romans',46:'1 Corinthians',47:'2 Corinthians',48:'Galatians',49:'Ephesians',
  50:'Philippians',51:'Colossians',52:'1 Thessalonians',53:'2 Thessalonians',54:'1 Timothy',
  55:'2 Timothy',56:'Titus',57:'Philemon',58:'Hebrews',59:'James',
  60:'1 Peter',61:'2 Peter',62:'1 John',63:'2 John',64:'3 John',
  65:'Jude',66:'Revelation',
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

function findBookId(raw: string): number | null {
  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!key || key.length < 2) return null

  // 1. Exact match
  if (BOOK_MAP[key] !== undefined) return BOOK_MAP[key]

  // 2. Starts-with (e.g. "phil" → philippians, min 3 chars)
  if (key.length >= 3) {
    const hits = Object.entries(BOOK_MAP).filter(([k]) => k.startsWith(key))
    if (hits.length === 1) return hits[0][1]
    // Multiple hits: pick shortest key (most specific)
    if (hits.length > 1) {
      hits.sort((a, b) => a[0].length - b[0].length)
      return hits[0][1]
    }
  }

  // 3. Fuzzy — levenshtein, more permissive for longer words
  let bestId: number | null = null, bestDist = Infinity
  for (const [k, id] of Object.entries(BOOK_MAP)) {
    const maxLen = Math.max(key.length, k.length)
    // Allow 1 error per 4 chars, minimum 1, max 4
    const thresh = Math.min(4, Math.max(1, Math.floor(maxLen / 4)))
    const d = levenshtein(key, k)
    if (d < bestDist && d <= thresh) { bestDist = d; bestId = id }
  }
  return bestId
}

interface ParsedRef { bookId: number; bookName: string; chapter: number; verse?: number }

const NUM_WORDS: Array<[RegExp, string]> = [
  [/\btwenty[\s-]?one\b/g,'21'],[/\btwenty[\s-]?two\b/g,'22'],[/\btwenty[\s-]?three\b/g,'23'],
  [/\btwenty[\s-]?four\b/g,'24'],[/\btwenty[\s-]?five\b/g,'25'],[/\btwenty[\s-]?six\b/g,'26'],
  [/\btwenty[\s-]?seven\b/g,'27'],[/\btwenty[\s-]?eight\b/g,'28'],[/\btwenty[\s-]?nine\b/g,'29'],
  [/\btwenty\b/g,'20'],[/\bsixteen\b/g,'16'],[/\bseventeen\b/g,'17'],
  [/\beighteen\b/g,'18'],[/\bnineteen\b/g,'19'],[/\bfifteen\b/g,'15'],
  [/\bfourteen\b/g,'14'],[/\bthirteen\b/g,'13'],[/\btwelve\b/g,'12'],
  [/\beleven\b/g,'11'],[/\bten\b/g,'10'],[/\bnine\b/g,'9'],
  [/\beight\b/g,'8'],[/\bseven\b/g,'7'],[/\bsix\b/g,'6'],
  [/\bfive\b/g,'5'],[/\bfour\b/g,'4'],[/\bthree\b/g,'3'],
  [/\btwo\b/g,'2'],[/\bone\b/g,'1'],
]

// Tamil number words → digits  (spoken Tanglish phonetics as transcribed by en-IN)
const TAMIL_NUM_WORDS: Array<[RegExp, string]> = [
  // ── Compound two-word forms (must be first: "irupadhu ainthu" → 25) ────────
  [/\b(irupadhu|erupadhu)\s+(ainthu|anju|aindu)\b/gi,'25'],[/\b(irupadhu|erupadhu)\s+(ondru|onru)\b/gi,'21'],
  [/\b(irupadhu|erupadhu)\s+(irandu|erandu|rendu)\b/gi,'22'],[/\b(irupadhu|erupadhu)\s+(moonru|munru|moonu)\b/gi,'23'],
  [/\b(irupadhu|erupadhu)\s+(naangu|nangu|nalu)\b/gi,'24'],[/\b(irupadhu|erupadhu)\s+(aaru|aru)\b/gi,'26'],
  [/\b(irupadhu|erupadhu)\s+(ezhu|yezu|yezhu)\b/gi,'27'],[/\b(irupadhu|erupadhu)\s+ettu\b/gi,'28'],
  [/\b(irupadhu|erupadhu)\s+(onbadhu|ombadhu|onpathu)\b/gi,'29'],
  [/\bmuppadhu\s+(ondru|onru)\b/gi,'31'],[/\bmuppadhu\s+(irandu|erandu|rendu)\b/gi,'32'],
  [/\bmuppadhu\s+(moonru|munru|moonu)\b/gi,'33'],[/\bmuppadhu\s+(naangu|nangu|nalu)\b/gi,'34'],
  [/\bmuppadhu\s+(ainthu|anju|aindu)\b/gi,'35'],[/\bmuppadhu\s+(aaru|aru)\b/gi,'36'],
  [/\bmuppadhu\s+(ezhu|yezu|yezhu)\b/gi,'37'],[/\bmuppadhu\s+ettu\b/gi,'38'],
  [/\bmuppadhu\s+(onbadhu|ombadhu|onpathu)\b/gi,'39'],
  [/\bnaarpadhu\s+(ondru|onru)\b/gi,'41'],[/\bnaarpadhu\s+(irandu|erandu|rendu)\b/gi,'42'],
  [/\bnaarpadhu\s+(moonru|munru|moonu)\b/gi,'43'],[/\bnaarpadhu\s+(naangu|nangu|nalu)\b/gi,'44'],
  [/\bnaarpadhu\s+(ainthu|anju|aindu)\b/gi,'45'],[/\bnaarpadhu\s+(aaru|aru)\b/gi,'46'],
  [/\bnaarpadhu\s+(ezhu|yezu|yezhu)\b/gi,'47'],[/\bnaarpadhu\s+ettu\b/gi,'48'],
  [/\bnaarpadhu\s+(onbadhu|ombadhu|onpathu)\b/gi,'49'],
  [/\baimpadhu\s+(ondru|onru)\b/gi,'51'],[/\baimpadhu\s+(irandu|erandu|rendu)\b/gi,'52'],
  [/\baimpadhu\s+(moonru|munru|moonu)\b/gi,'53'],[/\baimpadhu\s+(naangu|nangu|nalu)\b/gi,'54'],
  [/\baimpadhu\s+(ainthu|anju|aindu)\b/gi,'55'],[/\baimpadhu\s+(aaru|aru)\b/gi,'56'],
  [/\baimpadhu\s+(ezhu|yezu|yezhu)\b/gi,'57'],[/\baimpadhu\s+ettu\b/gi,'58'],
  [/\baimpadhu\s+(onbadhu|ombadhu|onpathu)\b/gi,'59'],
  [/\barupadhu\s+(ondru|onru)\b/gi,'61'],[/\barupadhu\s+(irandu|erandu|rendu)\b/gi,'62'],
  [/\barupadhu\s+(moonru|munru|moonu)\b/gi,'63'],[/\barupadhu\s+(naangu|nangu|nalu)\b/gi,'64'],
  [/\barupadhu\s+(ainthu|anju|aindu)\b/gi,'65'],[/\barupadhu\s+(aaru|aru)\b/gi,'66'],
  [/\barupadhu\s+(ezhu|yezu|yezhu)\b/gi,'67'],[/\barupadhu\s+ettu\b/gi,'68'],
  [/\barupadhu\s+(onbadhu|ombadhu|onpathu)\b/gi,'69'],
  [/\bezhupadhu\s+(ondru|onru)\b/gi,'71'],[/\bezhupadhu\s+(irandu|erandu|rendu)\b/gi,'72'],
  [/\bezhupadhu\s+(moonru|munru|moonu)\b/gi,'73'],[/\bezhupadhu\s+(naangu|nangu|nalu)\b/gi,'74'],
  [/\bezhupadhu\s+(ainthu|anju|aindu)\b/gi,'75'],[/\bezhupadhu\s+(aaru|aru)\b/gi,'76'],
  [/\bezhupadhu\s+(ezhu|yezu|yezhu)\b/gi,'77'],[/\bezhupadhu\s+ettu\b/gi,'78'],
  [/\bezhupadhu\s+(onbadhu|ombadhu|onpathu)\b/gi,'79'],
  [/\benpadhu\s+(ondru|onru)\b/gi,'81'],[/\benpadhu\s+(irandu|erandu|rendu)\b/gi,'82'],
  [/\benpadhu\s+(moonru|munru|moonu)\b/gi,'83'],[/\benpadhu\s+(naangu|nangu|nalu)\b/gi,'84'],
  [/\benpadhu\s+(ainthu|anju|aindu)\b/gi,'85'],[/\benpadhu\s+(aaru|aru)\b/gi,'86'],
  [/\benpadhu\s+(ezhu|yezu|yezhu)\b/gi,'87'],[/\benpadhu\s+ettu\b/gi,'88'],
  [/\benpadhu\s+(onbadhu|ombadhu|onpathu)\b/gi,'89'],
  [/\bthonnooru\s+(ondru|onru)\b/gi,'91'],[/\bthonnooru\s+(irandu|erandu|rendu)\b/gi,'92'],
  [/\bthonnooru\s+(moonru|munru|moonu)\b/gi,'93'],[/\bthonnooru\s+(naangu|nangu|nalu)\b/gi,'94'],
  [/\bthonnooru\s+(ainthu|anju|aindu)\b/gi,'95'],[/\bthonnooru\s+(aaru|aru)\b/gi,'96'],
  [/\bthonnooru\s+(ezhu|yezu|yezhu)\b/gi,'97'],[/\bthonnooru\s+ettu\b/gi,'98'],
  [/\bthonnooru\s+(onbadhu|ombadhu|onpathu)\b/gi,'99'],
  // nooru (100) combos → 101–150
  [/\bnooru\s+(ondru|onru)\b/gi,'101'],[/\bnooru\s+(irandu|erandu|rendu)\b/gi,'102'],
  [/\bnooru\s+(moonru|munru|moonu)\b/gi,'103'],[/\bnooru\s+(naangu|nangu|nalu)\b/gi,'104'],
  [/\bnooru\s+(ainthu|anju|aindu)\b/gi,'105'],[/\bnooru\s+(aaru|aru)\b/gi,'106'],
  [/\bnooru\s+(ezhu|yezu|yezhu)\b/gi,'107'],[/\bnooru\s+ettu\b/gi,'108'],
  [/\bnooru\s+(onbadhu|ombadhu|onpathu)\b/gi,'109'],
  [/\bnooru\s+(paththu|pathu)\b/gi,'110'],[/\bnooru\s+(irupadhu|erupadhu)\b/gi,'120'],
  [/\bnooru\s+muppadhu\b/gi,'130'],[/\bnooru\s+naarpadhu\b/gi,'140'],
  [/\bnooru\s+aimpadhu\b/gi,'150'],

  // ── Teen numbers 19→11 (before tens, to avoid partial matches) ────────────
  [/\bpaththonbadhu\b|\bpathonbadhu\b|\bpaththombadhu\b/gi,'19'],
  [/\bpadhinettu\b|\bpathinettu\b/gi,'18'],
  [/\bpadhinezhu\b|\bpathinezhu\b/gi,'17'],
  [/\bpadhinaaru\b|\bpathinaaru\b|\bpathinaru\b/gi,'16'],
  [/\bpadhinainthu\b|\bpathinainthu\b|\bpathinanchu\b|\bpathaintu\b|\bpadhinaintu\b|\bpathinaynthu\b/gi,'15'],
  [/\bpadhinaangu\b|\bpathinaangu\b|\bpathinangu\b|\bpathinalu\b/gi,'14'],
  [/\bpadhimoonru\b|\bpathimoonru\b|\bpadhimoonu\b|\bpathimoonu\b/gi,'13'],
  [/\bpannirandu\b|\bpannerandu\b|\bpanirandu\b|\bpannierandu\b/gi,'12'],
  [/\bpadhinondru\b|\bpathinondru\b|\bpandrondru\b/gi,'11'],

  // ── Tens (alone) ──────────────────────────────────────────────────────────
  [/\bthonnooru\b|\bthonnuru\b/gi,'90'],
  [/\benpadhu\b|\benbadhu\b|\bembadhu\b/gi,'80'],
  [/\bezhupadhu\b|\byezhubadhu\b|\bezhubadhu\b/gi,'70'],
  [/\barupadhu\b|\barubadhu\b|\baruvathu\b/gi,'60'],
  [/\baimpadhu\b|\baimbadhu\b|\baimpathu\b/gi,'50'],
  [/\bnaarpadhu\b|\bnarpadhu\b|\bnaarbadhu\b/gi,'40'],
  [/\bmuppadhu\b|\bmuppadu\b|\bmuppathu\b/gi,'30'],
  [/\birupadhu\b|\berupadhu\b|\biruvathu\b/gi,'20'],
  [/\bpaththu\b|\bpathu\b|\bpatthu\b/gi,'10'],
  [/\bnooru\b|\bnuru\b/gi,'100'],

  // ── Single digits ─────────────────────────────────────────────────────────
  [/\bonbadhu\b|\bombadhu\b|\bonpathu\b|\bonbathu\b/gi,'9'],
  [/\bettu\b|\betdu\b/gi,'8'],
  [/\bezhu\b|\byezu\b|\byezhu\b/gi,'7'],
  [/\baaru\b|\baru\b/gi,'6'],
  [/\bainthu\b|\banju\b|\baindu\b|\banthu\b/gi,'5'],
  [/\bnaangu\b|\bnangu\b|\bnalu\b|\bnaalgu\b/gi,'4'],
  [/\bmoonru\b|\bmunru\b|\bmoonu\b|\bmoondru\b/gi,'3'],
  [/\birandu\b|\berandu\b|\brendu\b|\brandu\b/gi,'2'],
  [/\bondru\b|\bonru\b|\bonu\b/gi,'1'],
]

function normalise(raw: string): string {
  let t = raw.toLowerCase().trim()
  // Tamil filler words
  t = t.replace(/\badhikaram\b/g,'').replace(/\bvachanam\b/g,'').replace(/\bvaakyam\b/g,'')
       .replace(/\bvivilia\b/g,'').replace(/\bviviliagam\b/g,'').replace(/\bparisuttha\b/g,'')
  // Tamil number words (compound first, then singles) — before English
  for (const [re, rep] of TAMIL_NUM_WORDS) t = t.replace(re, rep)
  // ordinals
  t = t.replace(/\bfirst\b/g,'1').replace(/\bsecond\b/g,'2').replace(/\bthird\b/g,'3')
       .replace(/\b1st\b/g,'1').replace(/\b2nd\b/g,'2').replace(/\b3rd\b/g,'3')
  // English number words
  for (const [re, rep] of NUM_WORDS) t = t.replace(re, rep)
  // strip filler
  t = t.replace(/\bthe book of\b/g,'').replace(/\bbook of\b/g,'')
       .replace(/\bchapter\b/g,'').replace(/\bverse\b/g,'').replace(/\bverses\b/g,'')
       .replace(/\bof\b/g,'').replace(/\band\b/g,'')
       .replace(/:/g,' ').replace(/[,\.]/g,' ').replace(/\s+/g,' ').trim()
  return t
}

function parseReference(raw: string): ParsedRef | null {
  const t = normalise(raw)

  // Patterns to try, in order
  const patterns: RegExp[] = [
    /^(\d)\s+([a-z]+(?:\s+[a-z]+)?)\s+(\d+)\s+(\d+)$/,  // "1 john 3 16"
    /^(\d)\s+([a-z]+(?:\s+[a-z]+)?)\s+(\d+)$/,           // "1 john 3"
    /^([a-z]+(?:\s[a-z]+){0,2})\s+(\d+)\s+(\d+)$/,       // "john 3 16" / "song of solomon 3 4"
    /^([a-z]+(?:\s[a-z]+){0,2})\s+(\d+)$/,               // "john 3"
  ]

  for (const pat of patterns) {
    const m = t.match(pat)
    if (!m) continue

    let bookRaw: string, chapter: number, verse: number | undefined

    if (/^\^\(\\d\)/.test(pat.source)) {
      // numbered-book pattern
      bookRaw = m[1] + m[2]
      chapter = parseInt(m[3])
      verse = m[4] ? parseInt(m[4]) : undefined
    } else {
      bookRaw = m[1]
      chapter = parseInt(m[2])
      verse = m[3] ? parseInt(m[3]) : undefined
    }

    const bookId = findBookId(bookRaw)
    if (bookId && !isNaN(chapter) && chapter > 0) {
      return { bookId, bookName: BOOK_NAMES[bookId], chapter, verse }
    }
  }
  return null
}

// Try parsing a numbered-book pattern separately (regex group detection is tricky)
function tryNumberedBook(t: string): ParsedRef | null {
  const m = t.match(/^(\d)\s+(\S+)\s+(\d+)(?:\s+(\d+))?$/)
  if (!m) return null
  const bookRaw = m[1] + m[2]
  const chapter = parseInt(m[3])
  const verse = m[4] ? parseInt(m[4]) : undefined
  const bookId = findBookId(bookRaw)
  if (bookId && !isNaN(chapter) && chapter > 0)
    return { bookId, bookName: BOOK_NAMES[bookId], chapter, verse }
  return null
}

function bestParse(raw: string): ParsedRef | null {
  return parseReference(raw) || tryNumberedBook(normalise(raw))
}

// Try every alternative transcript and return first match
function tryAllAlternatives(texts: string[]): { ref: ParsedRef | null; heard: string } {
  for (const t of texts) {
    const ref = bestParse(t)
    if (ref) return { ref, heard: t }
  }
  return { ref: null, heard: texts[0] || '' }
}

export default function VoiceFab() {
  const sheetOpen = useAppStore((s) => s.sheetOpen)
  const [listening, setListening]   = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [heard, setHeard]           = useState('')
  const [matched, setMatched]       = useState<ParsedRef | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [showPanel, setShowPanel]   = useState(false)
  const [manualText, setManualText] = useState('')
  const [prefetching, setPrefetching] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechAPI: any =
    typeof window !== 'undefined'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null

  useEffect(() => () => { recRef.current?.abort(); clearTimer() }, [])

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  function closePanel() {
    recRef.current?.abort()
    setListening(false)
    setAiThinking(false)
    setShowPanel(false)
    setHeard('')
    setMatched(null)
    setError(null)
    setManualText('')
    clearTimer()
  }

  function openPanel() {
    setShowPanel(true)
    setError(null)
    setHeard('')
    setMatched(null)
    setManualText('')
    // Start listening immediately
    if (SpeechAPI) setTimeout(startListening, 100)
    else setTimeout(() => inputRef.current?.focus(), 200)
  }

  async function startListening() {
    if (!SpeechAPI) {
      setError('Voice not supported in this browser. Please type below.')
      inputRef.current?.focus()
      return
    }
    clearTimer()
    setError(null)
    setHeard('')
    setMatched(null)

    // Explicitly request mic permission first — this triggers the iOS/browser permission dialog
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately — we only needed the permission grant
      stream.getTracks().forEach(t => t.stop())
    } catch {
      setError('Microphone access denied.\n\niPhone: Go to Settings → Tamil English AI Bible → Microphone and enable it.\nBrowser: Click the lock icon in the address bar and allow microphone.')
      setTimeout(() => inputRef.current?.focus(), 100)
      return
    }

    setListening(true)

    const rec = new SpeechAPI()
    // en-IN = Indian English — much better for non-native / South Asian speakers
    rec.lang = 'en-IN'
    rec.interimResults = true
    rec.maxAlternatives = 10   // try all 10 alternatives
    rec.continuous = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      // Collect all alternatives
      const alts = Array.from({ length: result.length }, (_, i) => result[i].transcript)
      setHeard(alts[0])

      if (result.isFinal) {
        setListening(false)
        const { ref, heard: h } = tryAllAlternatives(alts)
        setHeard(h)
        if (ref) {
          setMatched(ref)
          goNavigate(ref)
        } else {
          // Regex failed — try AI fallback
          tryAIParse(h)
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setListening(false)
      if (e.error === 'not-allowed') {
        setError('Microphone blocked. Please allow mic access in browser settings.')
      } else if (e.error === 'no-speech') {
        setError('Nothing heard. Tap the mic and speak clearly.')
      } else {
        setError('Could not hear clearly. Please type the reference below.')
      }
      setTimeout(() => inputRef.current?.focus(), 100)
    }

    rec.onend = () => setListening(false)
    recRef.current = rec
    rec.start()
  }

  async function tryAIParse(text: string) {
    setAiThinking(true)
    setError(null)
    try {
      const res = await aiApi.voiceParse(text)
      const data = res.data
      if (data.type === 'reference' && data.bookId && data.chapterNo) {
        const ref: ParsedRef = {
          bookId: data.bookId,
          bookName: BOOK_NAMES[data.bookId] ?? `Book ${data.bookId}`,
          chapter: data.chapterNo,
          verse: data.verseNo ?? undefined,
        }
        setMatched(ref)
        goNavigate(ref)
      } else if (data.type === 'search' && data.query) {
        goSearch(data.query)
      } else {
        setManualText(text)
        setError(`Heard: "${text}" — couldn't find a match. Edit below or try again.`)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    } catch {
      setManualText(text)
      setError(`Heard: "${text}" — edit below or try again.`)
      setTimeout(() => inputRef.current?.focus(), 100)
    } finally {
      setAiThinking(false)
    }
  }

  async function goNavigate(ref: ParsedRef) {
    clearTimer()
    const { language, bibleVersion } = useAppStore.getState()
    const lang = language === 'bilingual' ? 'english' : language
    const key = `${ref.bookId}-${ref.chapter}-${lang}-${language === 'bilingual'}-${bibleVersion}`
    if (!chapterCache[key]) {
      setPrefetching(true)
      const fetchP = bibleApi.getChapter(ref.bookId, ref.chapter, lang, language === 'bilingual', bibleVersion)
        .then((res) => { chapterCache[key] = res.data })
        .catch(() => {})
      await Promise.race([fetchP, new Promise(r => setTimeout(r, 8000))])
      setPrefetching(false)
    }
    closePanel()
    navigate(`/read/${ref.bookId}/${ref.chapter}${ref.verse ? `?verse=${ref.verse}` : ''}`)
  }

  function goSearch(q: string) {
    if (!q.trim()) return
    closePanel()
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  function handleManual(text: string) {
    const t = text.trim()
    if (!t) return
    const ref = bestParse(t)
    if (ref) goNavigate(ref)
    else tryAIParse(t)
  }

  // Hide mic when a bottom sheet (verse picker, etc.) is open so it doesn't block content
  if (sheetOpen) return null

  return (
    <>
      {showPanel && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-28"
          onClick={closePanel}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <p className="font-semibold text-gray-800">Voice / Search</p>
              <button onClick={closePanel} className="p-1 text-gray-400 min-h-0 min-w-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mic button */}
            <div className="flex justify-center mb-3">
              <button
                onClick={listening ? () => recRef.current?.stop() : startListening}
                className={clsx(
                  'w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg',
                  listening
                    ? 'bg-red-500 mic-recording shadow-red-300'
                    : 'bg-maroon-700 hover:bg-maroon-800'
                )}
              >
                <Mic className="h-7 w-7 text-white" />
              </button>
            </div>

            {/* Hint */}
            <p className="text-center text-xs text-gray-500 mb-1">
              {listening ? '🎙 Listening… speak now' : 'Tap mic and speak, or type below'}
            </p>
            <div className="bg-cream-50 rounded-xl px-3 py-2 mb-3 space-y-1">
              <p className="text-xs text-gray-500 font-medium">Try saying:</p>
              <p className="text-xs text-gray-600">"John 3:16" · "Psalm 23" · "Yovaan moonru pathinaaru"</p>
              <p className="text-xs text-gray-600">"The verse about love is patient"</p>
              <p className="text-xs text-gray-600">"Armor of God" · "faith moving mountains"</p>
              <div className="flex items-center gap-1 mt-1">
                <Sparkles className="h-3 w-3 text-maroon-400" />
                <p className="text-[10px] text-maroon-500">AI understands topics &amp; natural language</p>
              </div>
            </div>

            {/* Live transcript */}
            {heard && !matched && !error && !aiThinking && (
              <div className="bg-cream-100 rounded-xl px-3 py-2 mb-3 text-center">
                <p className="text-sm text-maroon-700 italic">"{heard}"</p>
                <p className="text-xs text-gray-400 mt-0.5">Processing…</p>
              </div>
            )}

            {/* AI thinking */}
            {aiThinking && (
              <div className="bg-maroon-50 border border-maroon-200 rounded-xl px-4 py-3 mb-3 flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-maroon-500 shrink-0 animate-pulse" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-maroon-700">AI is understanding your query…</p>
                  {heard && <p className="text-xs text-gray-400 mt-0.5 italic">"{heard}"</p>}
                </div>
                <div className="flex gap-0.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-maroon-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Matched — prefetch then navigate */}
            {matched && (
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl px-4 py-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  {prefetching
                    ? <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    : <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  }
                  <p className="text-xs text-gray-500">
                    {prefetching ? 'Loading chapter…' : 'Ready — opening…'}
                  </p>
                </div>
                <p className="font-bold text-emerald-800 text-base">
                  {matched.bookName} {matched.chapter}{matched.verse ? `:${matched.verse}` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-1">Heard: "{heard}"</p>
                <button
                  onClick={closePanel}
                  className="mt-2 text-xs text-gray-400 underline min-h-0 min-w-0"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Error */}
            {error && !matched && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
                {error.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i} className={`text-xs text-amber-700 ${i > 0 ? 'mt-1' : ''}`}>{line}</p>
                ))}
              </div>
            )}

            {/* Text input — always visible */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="John 3:16 · Yovaan 3 16 · Maarkku anju pathinanchu"
                className="flex-1 border-2 border-cream-300 focus:border-maroon-700 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                onKeyDown={(e) => { if (e.key === 'Enter') handleManual(manualText) }}
              />
              <button
                onClick={() => handleManual(manualText)}
                className="px-3 py-2.5 bg-maroon-700 text-white rounded-xl hover:bg-maroon-800 min-h-0 min-w-0"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              Works for any format — "Jn 3:16" · "john three 16" · "revelation 22"
            </p>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={showPanel ? closePanel : openPanel}
        className={clsx(
          'fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95',
          listening ? 'bg-red-500 mic-recording' : 'bg-maroon-700 hover:bg-maroon-800'
        )}
        title="Tap to speak or type a Bible reference"
      >
        <Mic className="h-6 w-6 text-white" />
      </button>
    </>
  )
}
