import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'
import { useStore } from '../store'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'

interface Slide {
  type: string
  title: string
  body: string
  emoji: string
}

const THEMES = {
  purple: { bg: 'from-gray-950 via-purple-950 to-gray-950', accent: '#a855f7', text: 'text-purple-400' },
  pink:   { bg: 'from-gray-950 via-pink-950 to-gray-950',   accent: '#ec4899', text: 'text-pink-400' },
  blue:   { bg: 'from-gray-950 via-blue-950 to-gray-950',   accent: '#3b82f6', text: 'text-blue-400' },
  green:  { bg: 'from-gray-950 via-emerald-950 to-gray-950',accent: '#10b981', text: 'text-emerald-400' },
}
type ThemeKey = keyof typeof THEMES

const TYPE_LABELS: Record<string, string> = {
  hook: 'פותח', problem: 'בעיה', solution: 'פתרון', proof: 'הוכחה', cta: 'CTA',
}

function SlideCard({
  slide, index, total, brandName, theme, accent,
}: {
  slide: Slide; index: number; total: number; brandName: string; theme: string; accent: string
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-between bg-gradient-to-br ${theme} rounded-2xl overflow-hidden`}
      style={{ width: 400, height: 400 }}
      dir="rtl"
    >
      {/* top bar */}
      <div className="w-full flex items-center justify-between px-6 pt-5">
        <span className="text-white/40 text-xs font-medium tracking-widest uppercase">{brandName}</span>
        <span className="text-white/30 text-xs">{index + 1} / {total}</span>
      </div>

      {/* main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
        <div className="text-5xl">{slide.emoji}</div>
        <h2
          className="text-white font-extrabold leading-tight"
          style={{ fontSize: 28, textShadow: `0 0 40px ${accent}55` }}
        >
          {slide.title}
        </h2>
        <p className="text-white/70 leading-relaxed" style={{ fontSize: 16 }}>
          {slide.body}
        </p>
      </div>

      {/* bottom accent bar */}
      <div className="w-full h-1.5 mt-auto" style={{ background: accent }} />
    </div>
  )
}

export default function Carousel() {
  const { currentScript } = useStore()
  const navigate = useNavigate()

  const [slides, setSlides] = useState<Slide[]>([])
  const [selected, setSelected] = useState(0)
  const [brandName, setBrandName] = useState('ActiveWear IL')
  const [themeKey, setThemeKey] = useState<ThemeKey>('purple')
  const [status, setStatus] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const previewRefs = useRef<(HTMLDivElement | null)[]>([])
  const theme = THEMES[themeKey]

  const generateMutation = useMutation({
    mutationFn: () =>
      apiPost<{ slides: Slide[] }>('/agents/carousel', {
        script: currentScript?.content ?? '',
        brandName,
        niche: currentScript?.niche ?? 'ספורטוויר נשים',
      }),
    onMutate: () => setStatus('מייצרת שקופיות...'),
    onSuccess: (data) => { setSlides(data.slides); setSelected(0); setStatus(null) },
    onError: () => setStatus('שגיאה — נסי שוב'),
  })

  const downloadSlide = async (index: number) => {
    const el = previewRefs.current[index]
    if (!el) return
    const canvas = await html2canvas(el, { scale: 2.7, useCORS: true, backgroundColor: null, logging: false })
    const link = document.createElement('a')
    link.download = `slide-${index + 1}-${brandName.replace(/\s/g, '_')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const downloadAll = async () => {
    if (!slides.length) return
    setDownloading(true)
    setStatus('מורידה את כל השקופיות...')
    try {
      const zip = new JSZip()
      for (let i = 0; i < previewRefs.current.length; i++) {
        const el = previewRefs.current[i]
        if (!el) continue
        const canvas = await html2canvas(el, { scale: 2.7, useCORS: true, backgroundColor: null, logging: false })
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'))
        zip.file(`slide-${i + 1}.png`, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.download = `${brandName.replace(/\s/g, '_')}-carousel.zip`
      link.href = URL.createObjectURL(content)
      link.click()
      setStatus(`הורדת ${slides.length} שקופיות ✓`)
    } finally {
      setDownloading(false)
    }
  }

  const updateSlide = (i: number, field: keyof Slide, value: string) => {
    setSlides((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  if (!currentScript?.content) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <div className="text-5xl">🎠</div>
        <h2 className="text-xl font-bold text-white">אין סקריפט עדיין</h2>
        <p className="text-gray-400">קודם ייצרי סקריפט בסטודיו</p>
        <button onClick={() => navigate('/studio')} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
          לסטודיו →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">קרוסל / Reels 🎠</h1>
          <p className="text-sm text-gray-400 mt-1">AI מייצרת שקופיות ממותגות מוכנות להורדה</p>
        </div>
        <div className="flex gap-2">
          {slides.length > 0 && (
            <button
              onClick={downloadAll}
              disabled={downloading}
              className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              {downloading ? <span className="animate-spin">⏳</span> : '⬇️'}
              הורד ZIP
            </button>
          )}
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            {generateMutation.isPending ? <span className="animate-spin">⏳</span> : '✨'}
            {slides.length ? 'ייצרי מחדש' : 'ייצרי קרוסל'}
          </button>
        </div>
      </div>

      {/* Settings bar */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">שם מותג</label>
          <input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500 w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">ערכת צבעים</label>
          <div className="flex gap-1.5">
            {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setThemeKey(k)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${themeKey === k ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ background: THEMES[k].accent }}
              />
            ))}
          </div>
        </div>
      </div>

      {status && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${status.includes('✓') ? 'bg-green-900/40 text-green-300 border border-green-800' : status.includes('שגיאה') ? 'bg-red-900/40 text-red-300 border border-red-800' : 'bg-blue-900/40 text-blue-300 border border-blue-800'}`}>
          {status}
        </div>
      )}

      {slides.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <div className="text-5xl mb-4">🎠</div>
          <p>לחצי "ייצרי קרוסל" לקבלת 6 שקופיות ממותגות</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Slide list */}
          <div className="lg:col-span-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${selected === i ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'}`}
              >
                <span>{s.emoji}</span>
                <span className="whitespace-nowrap">{TYPE_LABELS[s.type] ?? s.type}</span>
              </button>
            ))}
          </div>

          {/* Preview + editor */}
          <div className="lg:col-span-4 grid md:grid-cols-2 gap-6">
            {/* Live preview */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-xs text-gray-500 uppercase tracking-widest">תצוגה מקדימה</div>
              <div ref={(el) => { previewRefs.current[selected] = el }}>
                <SlideCard
                  slide={slides[selected]}
                  index={selected}
                  total={slides.length}
                  brandName={brandName}
                  theme={theme.bg}
                  accent={theme.accent}
                />
              </div>
              <button
                onClick={() => downloadSlide(selected)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm border border-gray-700 flex items-center gap-2"
              >
                ⬇️ הורד שקופית {selected + 1}
              </button>
            </div>

            {/* Editor */}
            <div className="space-y-4">
              <div className="text-xs text-gray-500 uppercase tracking-widest">עריכה</div>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">אימוג'י</label>
                  <input
                    value={slides[selected].emoji}
                    onChange={(e) => updateSlide(selected, 'emoji', e.target.value)}
                    className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">כותרת</label>
                  <input
                    value={slides[selected].title}
                    onChange={(e) => updateSlide(selected, 'title', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">טקסט</label>
                  <textarea
                    value={slides[selected].body}
                    onChange={(e) => updateSlide(selected, 'body', e.target.value)}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500 resize-none"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* All slides mini strip */}
              <div className="grid grid-cols-3 gap-2">
                {slides.map((s, i) => (
                  <div key={i} ref={(el) => { if (i !== selected) previewRefs.current[i] = el }}>
                    <button onClick={() => setSelected(i)} className="w-full">
                      <div className={`rounded-xl overflow-hidden border-2 transition-all ${selected === i ? 'border-purple-500' : 'border-transparent'}`}>
                        <SlideCard
                          slide={s}
                          index={i}
                          total={slides.length}
                          brandName={brandName}
                          theme={theme.bg}
                          accent={theme.accent}
                        />
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
