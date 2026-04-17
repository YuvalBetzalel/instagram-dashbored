import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/client'
import { MediaItem } from '../store'

const FILTERS = [
  { id: '',          label: 'ללא פילטר', icon: '⬜' },
  { id: 'vivid',     label: 'ויוויד',    icon: '🌈' },
  { id: 'cinematic', label: 'קולנועי',   icon: '🎬' },
  { id: 'warm',      label: 'חם',        icon: '🌅' },
]

const SPEEDS = [
  { value: 0.5, label: '0.5x — איטי' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x — רגיל' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x — מהיר' },
]

export default function VideoEditor() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [overlayText, setOverlayText] = useState('')
  const [filter, setFilter] = useState('')
  const [speed, setSpeed] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const { data: media = [] } = useQuery<MediaItem[]>({
    queryKey: ['media'],
    queryFn: () => apiGet('/media'),
  })

  const videos = media.filter((m) => m.mimetype.startsWith('video/'))

  const processVideo = async () => {
    if (!selectedId) return
    setProcessing(true)
    setStatus('מעבדת סרטון... (עשוי לקחת דקה)')
    try {
      const res = await fetch(`/api/media/${selectedId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: overlayText || undefined, filter: filter || undefined, speed }),
      })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `processed-video-${Date.now()}.mp4`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('הסרטון מוכן — הורדה החלה ✓')
    } catch (e: any) {
      setStatus(`שגיאה: ${e.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const selected = videos.find((v) => v.id === selectedId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">עריכת וידאו 🎬</h1>
        <p className="text-sm text-gray-400 mt-1">בחרי סרטון, הוסיפי פילטר ועיבוד — AI עורכת אוטומטית</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video picker */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-300 text-sm flex items-center gap-2">🎥 בחרי סרטון</h2>
          {videos.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center text-gray-500">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm">אין סרטונים בספרייה</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {videos.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${selectedId === v.id ? 'border-purple-500 bg-purple-900/20' : 'border-gray-800 bg-gray-900 hover:bg-gray-800'}`}
                >
                  <div className="w-16 h-12 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <video src={`/api/uploads/${v.path}`} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-lg">▶</span>
                    </div>
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{v.filename}</p>
                    <p className="text-xs text-gray-500">{(v.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-300 text-sm flex items-center gap-2">⚙️ אפשרויות עריכה</h2>

          {/* Filter */}
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
            <label className="text-xs text-gray-400">פילטר צבע</label>
            <div className="grid grid-cols-2 gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${filter === f.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  <span>{f.icon}</span> {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
            <label className="text-xs text-gray-400">מהירות</label>
            <div className="space-y-1">
              {SPEEDS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeed(s.value)}
                  className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all ${speed === s.value ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text overlay */}
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-2">
            <label className="text-xs text-gray-400">טקסט על המסך (אופציונלי)</label>
            <input
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Hook, שם מותג, CTA..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-purple-500"
              dir="rtl"
            />
            <p className="text-xs text-gray-600">הטקסט יופיע בתחתית הסרטון</p>
          </div>
        </div>

        {/* Preview + action */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-300 text-sm flex items-center gap-2">👁️ תצוגה מקדימה</h2>
          {selected ? (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <video
                key={selected.id}
                src={`/api/uploads/${selected.path}`}
                className="w-full aspect-video object-contain bg-black"
                controls
                muted
              />
              <div className="p-3 text-xs text-gray-500 text-right truncate">{selected.filename}</div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 aspect-video flex items-center justify-center text-gray-600">
              <div className="text-center">
                <div className="text-3xl mb-2">🎬</div>
                <p className="text-sm">בחרי סרטון</p>
              </div>
            </div>
          )}

          {status && (
            <div className={`rounded-xl px-4 py-3 text-sm ${status.includes('✓') ? 'bg-green-900/40 text-green-300 border border-green-800' : status.includes('שגיאה') ? 'bg-red-900/40 text-red-300 border border-red-800' : 'bg-blue-900/40 text-blue-300 border border-blue-800'}`}>
              {status}
            </div>
          )}

          <button
            onClick={processVideo}
            disabled={!selectedId || processing}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {processing ? (
              <><span className="animate-spin">⏳</span> מעבדת...</>
            ) : (
              <><span>🎬</span> ערכי והורד</>
            )}
          </button>

          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-xs text-gray-500 space-y-1" dir="rtl">
            <p className="font-medium text-gray-400">מה ייעשה:</p>
            {filter && <p>• פילטר {FILTERS.find(f => f.id === filter)?.label}</p>}
            {speed !== 1 && <p>• מהירות {speed}x</p>}
            {overlayText && <p>• טקסט: "{overlayText}"</p>}
            {!filter && speed === 1 && !overlayText && <p className="text-gray-600">לא נבחרו אפשרויות עריכה</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
