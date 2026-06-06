import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { clsx } from 'clsx'
import { useAppStore, type Theme, type Language } from '../store/useAppStore'

export default function SettingsPage() {
  const navigate = useNavigate()
  const {
    language, setLanguage,
    theme, setTheme,
    fontSize, setFontSize,
    lineSpacing, setLineSpacing,
    fontFamily, setFontFamily,
  } = useAppStore()

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:text-maroon-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-maroon-700 font-serif">Settings</h1>
      </div>

      <div className="space-y-6">

        {/* Language */}
        <Section title="Language">
          <div className="flex gap-2">
            {(['english', 'tamil', 'bilingual'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl text-sm capitalize font-medium border-2 transition-colors',
                  language === l
                    ? 'bg-maroon-700 text-white border-maroon-700'
                    : 'bg-white text-gray-600 border-cream-300 hover:border-maroon-300'
                )}
              >
                {l === 'tamil' ? 'தமிழ்' : l === 'bilingual' ? 'Both' : 'English'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Bilingual shows English + Tamil side by side
          </p>
        </Section>

        {/* Theme */}
        <Section title="Theme">
          <div className="flex gap-2">
            {([
              ['light', 'Light', 'bg-white text-gray-900'],
              ['dark', 'Dark', 'bg-gray-900 text-white'],
              ['sepia', 'Sepia', 'bg-amber-50 text-amber-900'],
            ] as [Theme, string, string][]).map(([val, label, preview]) => (
              <button
                key={val}
                onClick={() => setTheme(val)}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all',
                  preview,
                  theme === val ? 'border-maroon-700 ring-2 ring-maroon-700/30' : 'border-gray-200'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        {/* Font size */}
        <Section title={`Font Size — ${fontSize}px`}>
          <input
            type="range" min={12} max={32} step={1} value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-full accent-maroon-700 h-2"
          />
          <div className="flex justify-between text-gray-400 mt-2">
            <span className="text-xs">A (12px)</span>
            <span className="text-sm">A (18px)</span>
            <span className="text-xl">A (32px)</span>
          </div>
          <p className="text-sm font-serif mt-3 leading-relaxed text-gray-600" style={{ fontSize }}>
            "For God so loved the world..."
          </p>
        </Section>

        {/* Line spacing */}
        <Section title="Line Spacing">
          <div className="flex gap-2">
            {(['compact', 'normal', 'relaxed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setLineSpacing(s)}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl text-sm capitalize font-medium border-2 transition-colors',
                  lineSpacing === s
                    ? 'bg-maroon-700 text-white border-maroon-700'
                    : 'bg-white text-gray-600 border-cream-300 hover:border-maroon-300'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </Section>

        {/* Font family */}
        <Section title="Font Style">
          <div className="grid grid-cols-2 gap-2">
            {([
              ['default',           'Default',        'Inter'],
              ['serif',             'Serif (Bible)',   'EB Garamond'],
              ['tamil-traditional', 'Tamil Style',     'Noto Sans Tamil'],
              ['dyslexic',          'Dyslexic-Friendly','OpenDyslexic'],
            ] as const).map(([val, label, font]) => (
              <button
                key={val}
                onClick={() => setFontFamily(val)}
                className={clsx(
                  'py-3 rounded-xl text-sm border-2 transition-colors text-left px-3',
                  fontFamily === val
                    ? 'border-maroon-700 bg-maroon-50 text-maroon-700'
                    : 'border-cream-300 bg-white text-gray-600 hover:border-maroon-300'
                )}
              >
                <p className="font-medium">{label}</p>
                <p className="text-xs text-gray-400">{font}</p>
              </button>
            ))}
          </div>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-cream-300 rounded-2xl p-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  )
}
