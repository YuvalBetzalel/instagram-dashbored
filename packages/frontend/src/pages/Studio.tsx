import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { apiPost } from '../api/client'
import { useStore } from '../store'

const contentTypes = ['Reel', 'קרוסל', 'תמונה בודדת', 'סטורי']
const niches = ['ספורטוויר נשים', 'לגינסים ייחודיים', 'חזיות ספורט', 'אימוניות', 'אורח חיים פעיל']

export default function Studio() {
  const { selectedMedia, currentScript, setCurrentScript, updateScriptCapcut, updateScriptHashtags, setGenerating } = useStore()
  const navigate = useNavigate()

  const [contentType, setContentType] = useState('Reel')
  const [niche, setNiche] = useState('ספורטוויר נשים')
  const [editedScript, setEditedScript] = useState(currentScript?.content ?? '')
  const [status, setStatus] = useState<string | null>(null)

  const scriptMutation = useMutation({
    mutationFn: () =>
      apiPost<{ result: string }>('/agents/script', {
        mediaIds: selectedMedia.map((m) => m.id),
        contentType,
        niche,
      }),
    onMutate: () => { setGenerating(true); setStatus('מייצרת סקריפט...') },
    onSuccess: (data) => {
      setEditedScript(data.result)
      setCurrentScript({ content: data.result, contentType, niche })
      setStatus(null)
    },
    onError: () => setStatus('שגיאה — נסי שוב'),
    onSettled: () => setGenerating(false),
  })

  const capcutMutation = useMutation({
    mutationFn: () =>
      apiPost<{ result: string }>('/agents/capcut', { script: editedScript, style: contentType }),
    onMutate: () => setStatus('מייצרת הוראות CapCut...'),
    onSuccess: (data) => {
      updateScriptCapcut(data.result)
      setStatus('הוראות CapCut מוכנות ✓')
      setTimeout(() => navigate('/capcut'), 800)
    },
    onError: () => setStatus('שגיאה ב-CapCut'),
    onSettled: () => setGenerating(false),
  })

  const hashtagsMutation = useMutation({
    mutationFn: () => apiPost<{ hashtags: string[] }>('/agents/hashtags', { script: editedScript }),
    onMutate: () => setStatus('מחפשת האשטגים...'),
    onSuccess: (data) => {
      updateScriptHashtags(data.hashtags)
      setStatus(`${data.hashtags.length} האשטגים נוספו ✓`)
    },
    onError: () => setStatus('שגיאה באשטגים'),
  })

  const isLoading = scriptMutation.isPending || capcutMutation.isPending || hashtagsMutation.isPending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">סטודיו 🎬</h1>
        <p className="text-sm text-gray-400 mt-1">בחרי סוג תוכן, ייצרי סקריפט, שלחי לCapCut</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Right panel — selected media */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <h2 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <span>🖼️</span> מדיה נבחרת
              {selectedMedia.length > 0 && (
                <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">{selectedMedia.length}</span>
              )}
            </h2>
            {selectedMedia.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-gray-500 text-sm">לא נבחרה מדיה</p>
                <button onClick={() => navigate('/library')} className="mt-2 text-purple-400 hover:text-purple-300 text-sm underline">
                  לכי לספרייה
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {selectedMedia.map((m) => {
                  const src = `/api/uploads/${m.path.split('/').pop()}`
                  const isVid = m.mimetype.startsWith('video/')
                  return (
                    <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-gray-800 relative">
                      {isVid
                        ? <video src={src} className="w-full h-full object-cover" muted />
                        : <img src={src} alt={m.filename} className="w-full h-full object-cover" />
                      }
                      {isVid && <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl">▶</span></div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-4">
            <h2 className="font-semibold text-gray-200 flex items-center gap-2"><span>⚙️</span> הגדרות</h2>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">סוג תוכן</label>
              <div className="flex flex-wrap gap-2">
                {contentTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setContentType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${contentType === t ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">נישה</label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500"
              >
                {niches.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Left panel — script */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80">
              <span className="font-semibold text-gray-200 flex items-center gap-2"><span>📝</span> סקריפט</span>
              <button
                onClick={() => scriptMutation.mutate()}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                {scriptMutation.isPending ? (
                  <><span className="animate-spin">⏳</span> מייצרת...</>
                ) : (
                  <><span>✨</span> ייצרי סקריפט</>
                )}
              </button>
            </div>
            <textarea
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              placeholder="לחצי &quot;ייצרי סקריפט&quot; לקבלת סקריפט ויראלי, או כתבי כאן..."
              className="w-full bg-transparent text-gray-300 placeholder-gray-600 p-4 text-sm leading-relaxed resize-none focus:outline-none min-h-[320px] font-sans"
              dir="rtl"
            />
          </div>

          {/* Hashtags */}
          {currentScript?.hashtags && currentScript.hashtags.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2"><span>#</span> האשטגים</h3>
              <div className="flex flex-wrap gap-2">
                {currentScript.hashtags.map((tag) => (
                  <span key={tag} className="bg-gray-800 text-purple-300 text-xs px-2.5 py-1 rounded-full border border-gray-700">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          {status && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${status.includes('✓') ? 'bg-green-900/40 text-green-300 border border-green-800' : status.includes('שגיאה') ? 'bg-red-900/40 text-red-300 border border-red-800' : 'bg-blue-900/40 text-blue-300 border border-blue-800'}`}>
              {status}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => hashtagsMutation.mutate()}
              disabled={!editedScript || isLoading}
              className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-gray-700"
            >
              {hashtagsMutation.isPending ? <span className="animate-spin">⏳</span> : <span>#️⃣</span>}
              ייצרי האשטגים
            </button>
            <button
              onClick={() => capcutMutation.mutate()}
              disabled={!editedScript || isLoading}
              className="flex-1 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {capcutMutation.isPending ? <span className="animate-spin">⏳</span> : <span>✂️</span>}
              שלחי לCapCut
            </button>
            <button
              onClick={() => navigate('/publisher')}
              disabled={!editedScript}
              className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-gray-700"
            >
              <span>📤</span> פרסמי
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
