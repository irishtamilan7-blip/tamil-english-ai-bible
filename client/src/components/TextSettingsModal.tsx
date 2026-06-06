import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { useAppStore, type Theme } from '../store/useAppStore'

export default function TextSettingsModal({ onClose }: { onClose: () => void }) {
  const { fontSize, setFontSize, theme, setTheme, lineSpacing, setLineSpacing, fontFamily, setFontFamily } = useAppStore()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Text Settings</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>

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
      </div>
    </div>
  )
}
