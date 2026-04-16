import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

function parseSteps(guide: string): { title: string; items: string[] }[] {
  const sections: { title: string; items: string[] }[] = []
  let current: { title: string; items: string[] } | null = null

  for (const raw of guide.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const isSectionHeader = /^\*\*שלב\s+\d+/.test(line) || /^\*\*Step\s+\d+/i.test(line)
    if (isSectionHeader) {
      if (current) sections.push(current)
      current = { title: line.replace(/\*\*/g, ''), items: [] }
    } else if (current && (line.startsWith('☐') || line.startsWith('✓') || line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line))) {
      current.items.push(line.replace(/^(☐|✓|•|-|\*|\d+\.)/, '').trim())
    } else if (current && line.length > 5 && !line.startsWith('#')) {
      current.items.push(line)
    }
  }
  if (current) sections.push(current)
  return sections.filter((s) => s.items.length > 0)
}

export default function CapCut() {
  const { currentScript } = useStore()
  const navigate = useNavigate()
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const guide = currentScript?.capcut ?? ''
  const sections = useMemo(() => parseSteps(guide), [guide])
  const totalItems = sections.reduce((s, sec) => s + sec.items.length, 0)
  const doneCount = checked.size
  const pct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0

  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  if (!guide) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <div className="text-5xl">✂️</div>
        <h2 className="text-xl font-bold text-white">אין הוראות CapCut עדיין</h2>
        <p className="text-gray-400">קודם ייצרי סקריפט ב-סטודיו ושלחי לCapCut</p>
        <button
          onClick={() => navigate('/studio')}
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
        >
          לסטודיו →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">CapCut Guide ✂️</h1>
          <p className="text-sm text-gray-400 mt-1">רשימת עריכה שלב-אחר-שלב</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{doneCount}/{totalItems} שלבים</span>
          {pct === 100 && (
            <button
              onClick={() => navigate('/publisher')}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
            >
              🚀 לפרסום
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">התקדמות</span>
          <span className="text-sm font-bold text-white">{pct}%</span>
        </div>
        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && (
          <p className="text-green-400 text-sm mt-2 font-medium text-center">🎉 הסרטון מוכן לפרסום!</p>
        )}
      </div>

      {/* Steps */}
      {sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section, si) => (
            <div key={si} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-800">
                <h3 className="font-semibold text-gray-200 text-sm">{section.title}</h3>
              </div>
              <ul className="p-4 space-y-2">
                {section.items.map((item, ii) => {
                  const key = `${si}-${ii}`
                  const done = checked.has(key)
                  return (
                    <li
                      key={ii}
                      onClick={() => toggle(key)}
                      className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${done ? 'bg-green-900/20' : 'hover:bg-gray-800'}`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${done ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                        {done && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <span className={`text-sm leading-relaxed ${done ? 'line-through text-gray-500' : 'text-gray-300'}`}>{item}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        /* Fallback: show raw text */
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
          <pre className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed font-sans" dir="rtl">{guide}</pre>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => { setChecked(new Set()); }}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm font-medium border border-gray-700"
        >
          אפסי הכל
        </button>
        <button
          onClick={() => navigate('/studio')}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm font-medium border border-gray-700"
        >
          ← חזרה לסטודיו
        </button>
      </div>
    </div>
  )
}
