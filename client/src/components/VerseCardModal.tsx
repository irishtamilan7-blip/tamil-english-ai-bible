import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, Share2, Loader2, Image as ImgIcon, Palette, Plus } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  bookName: string
  chapterNo: number
  verseNo: number
  text: string
  textOther?: string
  language: string
  onClose: () => void
}

type BgOption =
  | { type: 'photo';    id: string; label: string; url: string; overlay: number }
  | { type: 'gradient'; id: string; label: string; colors: string[]; text: string; ref: string }

const PHOTOS: BgOption[] = [
  { type:'photo', id:'mountains',  label:'Mountains',  overlay:0.40, url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=85&fit=crop&crop=entropy' },
  { type:'photo', id:'ocean',      label:'Ocean',      overlay:0.38, url:'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1080&q=85&fit=crop&crop=entropy' },
  { type:'photo', id:'forest',     label:'Forest',     overlay:0.42, url:'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1080&q=85&fit=crop&crop=entropy' },
  { type:'photo', id:'sunrise',    label:'Sunrise',    overlay:0.35, url:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1080&q=85&fit=crop&crop=entropy' },
  { type:'photo', id:'stars',      label:'Night Sky',  overlay:0.30, url:'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&q=85&fit=crop&crop=entropy' },
  { type:'photo', id:'desert',     label:'Desert',     overlay:0.38, url:'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1080&q=85&fit=crop&crop=entropy' },
  { type:'photo', id:'flowers',    label:'Flowers',    overlay:0.35, url:'https://images.unsplash.com/photo-1490750967868-88df5691cc3?w=1080&q=85&fit=crop&crop=entropy' },
  { type:'photo', id:'lake',       label:'Lake',       overlay:0.38, url:'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1080&q=85&fit=crop&crop=entropy' },
  { type:'photo', id:'waterfall',  label:'Waterfall',  overlay:0.42, url:'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=1080&q=85&fit=crop&crop=entropy' },
  { type:'photo', id:'snow',       label:'Snow',       overlay:0.35, url:'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1080&q=85&fit=crop&crop=entropy' },
  { type:'photo', id:'autumn',     label:'Autumn',     overlay:0.38, url:'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=1080&q=85&fit=crop&crop=entropy' },
  { type:'photo', id:'clouds',     label:'Clouds',     overlay:0.32, url:'https://images.unsplash.com/photo-1463947628408-f8581a2f4aca?w=1080&q=85&fit=crop&crop=entropy' },
]

const GRADIENTS: BgOption[] = [
  { type:'gradient', id:'faith',   label:'Faith',    colors:['#3b0a0a','#7f1d1d','#b91c1c'], text:'#fde68a', ref:'#fca5a5' },
  { type:'gradient', id:'night',   label:'Night',    colors:['#020617','#0f172a','#312e81'], text:'#e0e7ff', ref:'#a5b4fc' },
  { type:'gradient', id:'ocean',   label:'Ocean',    colors:['#082f49','#0369a1','#7dd3fc'], text:'#ffffff', ref:'#bae6fd' },
  { type:'gradient', id:'forest',  label:'Forest',   colors:['#052e16','#166534','#4ade80'], text:'#ffffff', ref:'#bbf7d0' },
  { type:'gradient', id:'sunrise', label:'Sunrise',  colors:['#431407','#c2410c','#fde68a'], text:'#ffffff', ref:'#fde68a' },
  { type:'gradient', id:'gold',    label:'Golden',   colors:['#451a03','#92400e','#fde68a'], text:'#fff7ed', ref:'#fde68a' },
  { type:'gradient', id:'rose',    label:'Rose',     colors:['#4c0519','#be185d','#fda4af'], text:'#fff1f2', ref:'#fecdd3' },
  { type:'gradient', id:'purple',  label:'Royal',    colors:['#2e1065','#6d28d9','#c4b5fd'], text:'#f5f3ff', ref:'#ddd6fe' },
]

function thumbStyle(bg: BgOption): React.CSSProperties {
  if (bg.type === 'photo') return {
    backgroundImage: `url(${bg.url.replace('w=1080','w=200').replace('q=85','q=60')})`,
    backgroundSize: 'cover', backgroundPosition: 'center',
  }
  return { background: `linear-gradient(135deg, ${bg.colors.join(', ')})` }
}

// ── Canvas helpers ──────────────────────────────────────────────────────────
const isTamilStr = (s: string) => /[஀-௿]/.test(s)

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = word }
    else cur = test
  }
  if (cur) lines.push(cur)
  return lines
}

// Tamil: canvas measureText uses a tiny fallback font (Noto Serif Tamil is NOT loaded
// in the canvas context), so pixel measurements are ~40-50% of actual render width.
// Use Unicode code-point count instead — empirically calibrated for 1080px canvas.
function wrapTamilLines(text: string, maxCodePoints: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  let curLen = 0
  for (const word of words) {
    const wLen = [...word].length
    if (cur && curLen + 1 + wLen > maxCodePoints) {
      lines.push(cur)
      cur = word
      curLen = wLen
    } else {
      cur = cur ? `${cur} ${word}` : word
      curLen = cur === word ? wLen : curLen + 1 + wLen
    }
  }
  if (cur) lines.push(cur)
  return lines
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (!url.startsWith('blob:') && !url.startsWith('data:')) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

async function buildCanvas(bg: BgOption, mainText: string, otherText: string|undefined, showBoth: boolean, ref: string): Promise<HTMLCanvasElement> {
  const W = 1080, H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  const PAD = 100
  const VPAD = 120
  const REF_BLOCK_H = 80 + 44 + 18 + 2 + 50
  const SAFE_H = H - VPAD * 2 - REF_BLOCK_H  // max height for verse + secondary text

  // Clip canvas so nothing renders outside frame
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, W, H)
  ctx.clip()

  // ── Step 1: Pre-load fonts so measureText is accurate ──────────────────
  try {
    await document.fonts.ready
    await Promise.allSettled([
      document.fonts.load(`48px 'Noto Serif Tamil'`, 'அ'),
      document.fonts.load(`36px 'Noto Serif Tamil'`, 'அ'),
      document.fonts.load(`48px Georgia`, 'a'),
    ])
  } catch { /* degrade gracefully */ }

  // ── Step 2: Background ─────────────────────────────────────────────────
  if (bg.type === 'photo') {
    try {
      const img = await loadImage(bg.url)
      const scale = Math.max(W / img.width, H / img.height)
      const iw = img.width * scale, ih = img.height * scale
      ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih)
    } catch { ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H) }
    ctx.fillStyle = `rgba(0,0,0,${bg.overlay})`
    ctx.fillRect(0, 0, W, H)
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H)
    bg.colors.forEach((c, i) => g.addColorStop(i / (bg.colors.length - 1), c))
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  }

  const textColor = bg.type === 'photo' ? '#ffffff' : bg.text
  const refColor  = bg.type === 'photo' ? '#fde68a' : bg.ref

  const engMaxW = Math.round(W * 0.76)

  // ── Step 3: Calculate layout with overflow protection ──────────────────
  const isTamil = isTamilStr(mainText)

  // Helper: pick font size that keeps all content within SAFE_H
  function computeLayout(mainFS: number): {
    mainFont: string, lineH: number, lines: string[],
    secFont: string, secLineH: number, secLines: string[],
    verseH: number, secH: number, totalH: number
  } {
    const lineH = mainFS * 1.75
    const mainFont = isTamil
      ? `${mainFS}px 'Noto Serif Tamil', sans-serif`
      : `${mainFS}px Georgia, serif`

    // Use measureText for wrapping (font pre-loaded via document.fonts.load above).
    // Canvas clips any line that still overflows horizontally.
    ctx.font = mainFont
    const lines = wrapLines(ctx, `"${mainText}"`, engMaxW)
    const verseH = lines.length * lineH

    let secLines: string[] = [], secFont = '', secLineH = 0, secH = 0
    if (showBoth && otherText) {
      const isSecTamil = isTamilStr(otherText)
      // Secondary font is 75–80% of main size, min 28px
      const secSize = Math.max(28, Math.round(mainFS * 0.78))
      secFont = isSecTamil
        ? `${secSize}px 'Noto Serif Tamil', sans-serif`
        : `${secSize}px Georgia, serif`
      secLineH = secSize * 1.78
      ctx.font = secFont
      secLines = wrapLines(ctx, otherText, engMaxW)
      secH = 36 + 2 + 36 + secLines.length * secLineH
    }

    const totalH = verseH + secH
    return { mainFont, lineH, lines, secFont, secLineH, secLines, verseH, secH, totalH }
  }

  // Start with ideal font size, shrink if content overflows
  let mainFS = isTamil
    ? (mainText.length > 200 ? 36 : mainText.length > 100 ? 40 : 44)
    : (mainText.length > 250 ? 38 : mainText.length > 150 ? 44 : 50)

  let layout = computeLayout(mainFS)
  // Reduce font size until content fits, minimum 28px
  while (layout.totalH > SAFE_H && mainFS > 28) {
    mainFS -= 2
    layout = computeLayout(mainFS)
  }

  const { mainFont, lineH, lines, secFont, secLineH, secLines, verseH, secH, totalH } = layout

  // Vertically center content
  const startY = Math.round(VPAD + Math.max(0, (H - VPAD * 2 - totalH - REF_BLOCK_H) / 2) + mainFS)

  // ── Step 4: Draw content ────────────────────────────────────────────────

  // Decorative quote mark
  ctx.textAlign = 'left'
  ctx.font = `bold 180px Georgia, serif`
  ctx.fillStyle = textColor; ctx.globalAlpha = 0.10
  ctx.fillText('"', PAD - 15, startY - mainFS * 0.2)
  ctx.globalAlpha = 1

  // Main verse text — manually centered so complex scripts (Tamil) render correctly
  ctx.textAlign = 'left'
  ctx.font = mainFont
  ctx.fillStyle = textColor
  let y = startY
  for (const line of lines) {
    const lw = ctx.measureText(line).width
    ctx.fillText(line, Math.round((W - lw) / 2), y)
    y += lineH
  }

  // Secondary language text
  if (secLines.length > 0 && otherText) {
    y += 36
    ctx.globalAlpha = 0.18; ctx.fillStyle = textColor
    ctx.fillRect(PAD + 80, y, W - PAD * 2 - 160, 2)
    ctx.globalAlpha = 1; y += 36

    ctx.font = secFont
    ctx.fillStyle = textColor; ctx.globalAlpha = 0.80
    for (const line of secLines) {
      const lw = ctx.measureText(line).width
      ctx.fillText(line, Math.round((W - lw) / 2), y)
      y += secLineH
    }
    ctx.globalAlpha = 1
  }

  // Reference — right-aligned, clamped within frame
  const refY = Math.min(y + 80, H - 140)
  ctx.textAlign = 'right'
  ctx.font = `bold 38px Georgia, 'Noto Serif Tamil', serif`
  ctx.fillStyle = refColor
  ctx.fillText(`— ${ref}`, W - PAD, refY)

  // Divider
  ctx.globalAlpha = 0.20; ctx.fillStyle = textColor; ctx.textAlign = 'center'
  ctx.fillRect(PAD + 100, refY + 52, W - PAD * 2 - 200, 1)
  ctx.globalAlpha = 1

  // Branding
  ctx.font = `400 24px system-ui, sans-serif`
  ctx.fillStyle = textColor; ctx.globalAlpha = 0.40
  ctx.fillText('TAMIL ENGLISH AI BIBLE', W / 2, Math.min(refY + 100, H - 55))
  ctx.globalAlpha = 1

  ctx.restore()
  return canvas
}

// ── Component ───────────────────────────────────────────────────────────────
export default function VerseCardModal({ bookName, chapterNo, verseNo, text, textOther, language, onClose }: Props) {
  const [tab, setTab]               = useState<'photo'|'gradient'>('photo')
  const [photoBg, setPhotoBg]       = useState(0)
  const [gradBg, setGradBg]         = useState(0)
  const [showBoth, setShowBoth]     = useState(!!textOther)
  const [status, setStatus]         = useState<'idle'|'saving'|'saved'|'sharing'|'shared'>('idle')
  const [saveImgUrl, setSaveImgUrl] = useState<string | null>(null)
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null)
  const [useLocal, setUseLocal]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const refStr = `${bookName} ${chapterNo}:${verseNo}`
  const isMainTamil = language === 'tamil'

  const selectedBg: BgOption = useLocal && localPhotoUrl
    ? { type:'photo', id:'local', label:'My Photo', url:localPhotoUrl, overlay:0.35 }
    : tab === 'photo' ? PHOTOS[photoBg] : GRADIENTS[gradBg]

  const previewBg: React.CSSProperties =
    selectedBg.type === 'photo'
      ? { backgroundImage:`url(${useLocal ? selectedBg.url : selectedBg.url.replace('w=1080','w=800').replace('q=85','q=70')})`, backgroundSize:'cover', backgroundPosition:'center' }
      : { background:`linear-gradient(145deg, ${selectedBg.colors.join(', ')})` }

  const previewText  = selectedBg.type === 'photo' ? '#ffffff' : selectedBg.text
  const previewRef   = selectedBg.type === 'photo' ? '#fde68a' : selectedBg.ref
  const overlayAlpha = selectedBg.type === 'photo' ? selectedBg.overlay : 0

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (localPhotoUrl) URL.revokeObjectURL(localPhotoUrl)
    setLocalPhotoUrl(URL.createObjectURL(file))
    setUseLocal(true)
    e.target.value = ''
  }

  function clearLocalPhoto() {
    if (localPhotoUrl) URL.revokeObjectURL(localPhotoUrl)
    setLocalPhotoUrl(null)
    setUseLocal(false)
  }

  async function makeBlob(): Promise<{ blob: Blob; filename: string } | null> {
    const canvas = await buildCanvas(selectedBg, text, textOther, showBoth, refStr)
    const filename = `verse-${bookName.replace(/\s+/g,'-')}-${chapterNo}-${verseNo}.jpg`
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob ? { blob, filename } : null), 'image/jpeg', 0.92)
    })
  }

  // Share button — opens share sheet (WhatsApp, Messages, etc.)
  async function doShare() {
    setStatus('sharing')
    try {
      const result = await makeBlob()
      if (!result) return
      const { blob, filename } = result
      const file = new File([blob], filename, { type:'image/jpeg' })
      const canShare = !!navigator.share && (
        typeof navigator.canShare === 'function' ? navigator.canShare({ files:[file] }) : true
      )
      if (canShare) {
        try {
          await navigator.share({ files:[file], title:refStr })
          setStatus('shared')
          setTimeout(() => setStatus('idle'), 2500)
        } catch { setStatus('idle') /* cancelled */ }
      } else {
        // Desktop fallback
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = filename; a.click()
        URL.revokeObjectURL(url)
        setStatus('shared')
        setTimeout(() => setStatus('idle'), 2500)
      }
    } catch { setStatus('idle') }
  }

  // Save button — shows image full-screen so user can long-press → "Add to Photos"
  async function doSave() {
    setStatus('saving')
    try {
      const result = await makeBlob()
      if (!result) { setStatus('idle'); return }
      const url = URL.createObjectURL(result.blob)
      setSaveImgUrl(url)
    } catch { /* ignore */ } finally {
      setStatus('idle')
    }
  }

  function closeSaveOverlay() {
    if (saveImgUrl) URL.revokeObjectURL(saveImgUrl)
    setSaveImgUrl(null)
  }

  const showPhotoRow = tab === 'photo' || useLocal

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-black">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-3 text-white"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 active:bg-white/30 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold tracking-wide">Verse Card</p>
        {textOther ? (
          <button
            onClick={() => setShowBoth(v => !v)}
            className={clsx('text-xs px-2.5 py-1 rounded-full border transition-colors',
              showBoth ? 'bg-white text-gray-900 border-white' : 'text-white/60 border-white/30'
            )}
          >
            {isMainTamil ? 'EN' : 'தமிழ்'}
          </button>
        ) : <div className="w-9" />}
      </div>

      {/* ── Card preview — fills remaining space (no gap) ──────────────── */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-5 py-2 overflow-hidden">
        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ aspectRatio:'4/5', maxHeight:'100%', width:'100%', maxWidth:'280px', ...previewBg }}
        >
          {overlayAlpha > 0 && (
            <div className="absolute inset-0" style={{ background:`rgba(0,0,0,${overlayAlpha})` }} />
          )}
          <div className="absolute inset-0 flex flex-col justify-center px-5 py-5">
            <p
              className="font-serif leading-relaxed mb-2 text-center"
              style={{ color:previewText, fontSize:text.length>200?'10px':text.length>100?'12px':'14px', lineHeight:1.75 }}
            >
              "{text}"
            </p>
            {showBoth && textOther && (
              <>
                <div className="h-px my-2" style={{ background:`${previewText}30` }} />
                <p
                  className="font-tamil leading-relaxed mb-2 text-center"
                  style={{ color:`${previewText}cc`, fontSize:textOther.length>200?'9px':'11px', lineHeight:1.75 }}
                >
                  {textOther}
                </p>
              </>
            )}
            <p className="text-right text-[10px] font-semibold" style={{ color:previewRef }}>— {refStr}</p>
            <p className="text-center mt-2 tracking-widest" style={{ color:`${previewText}50`, fontSize:'7px' }}>TAMIL ENGLISH AI BIBLE</p>
          </div>
        </div>
      </div>

      {/* ── Bottom controls — all together, no gap ─────────────────────── */}
      <div className="shrink-0 bg-[#111] border-t border-white/10">
        {/* Tab switcher */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex bg-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setTab('photo'); setUseLocal(false) }}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors',
                tab==='photo' && !useLocal ? 'bg-white text-gray-900' : 'text-white/60'
              )}
            >
              <ImgIcon className="h-3.5 w-3.5" /> Photos
            </button>
            <button
              onClick={() => { setTab('gradient'); setUseLocal(false) }}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors',
                tab==='gradient' && !useLocal ? 'bg-white text-gray-900' : 'text-white/60'
              )}
            >
              <Palette className="h-3.5 w-3.5" /> Colors
            </button>
          </div>
        </div>

        {/* Thumbnail row */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {showPhotoRow ? (
              <>
                {/* My Photo tile */}
                <div className="shrink-0 relative">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className={clsx(
                      'w-14 h-14 rounded-xl border-2 overflow-hidden transition-all',
                      useLocal ? 'border-white scale-105' : 'border-dashed border-white/30 bg-white/8'
                    )}
                  >
                    {localPhotoUrl ? (
                      <img src={localPhotoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                        <Plus className="h-5 w-5 text-white/60" />
                        <span className="text-[8px] text-white/40 leading-none">My Photo</span>
                      </div>
                    )}
                  </button>
                  {/* Tap to clear local photo and return to presets */}
                  {localPhotoUrl && (
                    <button
                      onClick={clearLocalPhoto}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md z-10"
                    >
                      <X className="h-3 w-3 text-gray-900" />
                    </button>
                  )}
                </div>

                {PHOTOS.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => { setPhotoBg(i); setUseLocal(false) }}
                    className={clsx(
                      'shrink-0 w-14 h-14 rounded-xl border-2 overflow-hidden transition-all',
                      !useLocal && i===photoBg ? 'border-white scale-105' : 'border-transparent opacity-60 hover:opacity-90'
                    )}
                    style={thumbStyle(p)}
                    title={p.label}
                  />
                ))}
              </>
            ) : (
              GRADIENTS.map((g, i) => (
                <button
                  key={g.id}
                  onClick={() => setGradBg(i)}
                  title={g.label}
                  className={clsx(
                    'shrink-0 w-14 h-14 rounded-xl border-2 transition-all',
                    i===gradBg ? 'border-white scale-105' : 'border-transparent opacity-60 hover:opacity-90'
                  )}
                  style={thumbStyle(g)}
                />
              ))
            )}
          </div>
          <p className="text-white/35 text-[10px] text-center mt-1.5">
            {useLocal ? 'My Photo — tap × to use presets' : selectedBg.label}
          </p>
        </div>

        {/* Share / Save buttons */}
        <div
          className="px-4 pt-1 flex gap-3"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            onClick={doShare}
            disabled={status === 'sharing' || status === 'saving'}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white text-gray-900 rounded-2xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-transform"
          >
            {status === 'sharing'
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Share2 className="h-4 w-4" />}
            {status === 'shared' ? 'Shared ✓' : 'Share'}
          </button>
          <button
            onClick={doSave}
            disabled={status === 'sharing' || status === 'saving'}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm text-white disabled:opacity-50 active:scale-95 transition-transform border-2 border-white/25 bg-white/10"
          >
            {status === 'saving'
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      {/* ── Save overlay — long-press the image to add to Photos ─────────── */}
      {saveImgUrl && (
        <div className="fixed inset-0 z-[210] bg-black flex flex-col">
          {/* Header */}
          <div
            className="shrink-0 flex items-center justify-between px-4 py-3 text-white"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
          >
            <button
              onClick={closeSaveOverlay}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 active:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-sm font-semibold text-white">Save to Photos</p>
            <div className="w-9" />
          </div>

          {/* Image — long-press triggers iOS "Add to Photos" */}
          <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={saveImgUrl}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
              style={{ WebkitTouchCallout: 'default' } as React.CSSProperties}
              draggable={false}
            />
          </div>

          {/* Instruction */}
          <div
            className="shrink-0 px-6 py-4 text-center"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <p className="text-white/80 text-sm font-medium">Hold finger on image</p>
            <p className="text-white/45 text-xs mt-1">Then tap "Add to Photos" to save</p>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
