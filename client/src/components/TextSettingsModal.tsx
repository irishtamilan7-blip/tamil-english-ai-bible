import { X, Mic } from 'lucide-react'
import { clsx } from 'clsx'
import { useAppStore, type Theme } from '../store/useAppStore'

export default function TextSettingsModal({ onClose }: { onClose: () => void }) {
  const {
    fontSize, setFontSize,
    theme, setTheme,
    lineSpacing, setLineSpacing,
    fontFamily, setFontFamily,
    elevenLabsKey, setElevenLabsKey,
    elevenLabsVoiceId, setElevenLabsVoiceId,
  } = useAppStore()

  const voiceActive = !!elevenLabsKey && !!elevenLabsVoiceId

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full max-w-sm max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-5 pb-3 shrink-0">
          <h3 className="font-semibold text-gray-900">Settings</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>

        <div className="overflow-y-auto px-6 pb-8 space-y-6">

          {/* Font size */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Font Size: {fontSize}px</label>
            <input
              type="range" min={12} max={32} value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full accent-maroon-700"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>A</span><span className="text-base">A</span><span className="text-xl">A</span>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Theme</label>
            <div className="flex gap-2">
              {(['light', 'dark', 'sepia'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm capitalize border-2 transition-colors',
                    theme === t ? 'border-maroon-700 text-maroon-700 font-medium' : 'border-gray-200 text-gray-600',
                    t === 'light' && 'bg-white',
                    t === 'dark' && 'bg-gray-900 text-gray-100',
                    t === 'sepia' && 'bg-cream-200 text-amber-900',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Line spacing */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Line Spacing</label>
            <div className="flex gap-2">
              {(['compact', 'normal', 'relaxed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setLineSpacing(s)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm capitalize border-2',
                    lineSpacing === s ? 'border-maroon-700 text-maroon-700 font-medium' : 'border-gray-200 text-gray-600'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Font family */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Font</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['default', 'Default'],
                ['serif', 'Serif (Bible)'],
                ['tamil-traditional', 'Tamil'],
                ['dyslexic', 'Dyslexic'],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFontFamily(val)}
                  className={clsx(
                    'py-2 rounded-lg text-sm border-2',
                    fontFamily === val ? 'border-maroon-700 text-maroon-700 font-medium' : 'border-gray-200 text-gray-600'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Custom Voice (ElevenLabs) ────────────────────────── */}
          <div className="border-t border-cream-200 pt-5">
            <div className="flex items-center gap-2 mb-1">
              <Mic className="h-4 w-4 text-maroon-500 shrink-0" />
              <label className="text-sm font-medium text-gray-700">Custom Voice</label>
              {voiceActive && (
                <span className="ml-auto text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">ACTIVE</span>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Clone your voice at{' '}
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-maroon-600 underline"
              >
                elevenlabs.io
              </a>{' '}
              (free), then paste your API Key and Voice ID below. Works for English &amp; Tamil.
            </p>

            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide font-medium">API Key</p>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={elevenLabsKey}
                  onChange={(e) => setElevenLabsKey(e.target.value.trim())}
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-maroon-400 font-mono"
                />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide font-medium">Voice ID</p>
                <input
                  type="text"
                  placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                  value={elevenLabsVoiceId}
                  onChange={(e) => setElevenLabsVoiceId(e.target.value.trim())}
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-maroon-400 font-mono"
                />
              </div>
            </div>

            {voiceActive ? (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-emerald-600">Your voice will be used for audio reading</p>
                <button
                  onClick={() => { setElevenLabsKey(''); setElevenLabsVoiceId('') }}
                  className="text-xs text-red-400 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="mt-3 bg-cream-50 border border-cream-200 rounded-xl p-3 text-xs text-gray-500 space-y-1 leading-relaxed">
                <p className="font-medium text-gray-600">How to set up:</p>
                <p>1. Sign up free at elevenlabs.io</p>
                <p>2. Go to <strong>Voice Lab → Add Voice → Instant Voice Cloning</strong></p>
                <p>3. Record or upload 1–2 min of your voice</p>
                <p>4. Copy your <strong>API Key</strong> from Profile settings</p>
                <p>5. Copy your <strong>Voice ID</strong> from My Voices</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
