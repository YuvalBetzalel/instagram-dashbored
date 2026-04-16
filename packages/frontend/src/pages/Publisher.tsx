import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '../api/client'
import { useStore } from '../store'

interface Post {
  id: string
  caption: string
  scheduledAt: string
  publishedAt: string | null
  status: 'pending' | 'published' | 'failed'
  script?: { content: string; contentType: string } | null
}

interface FormData {
  caption: string
  scheduledAt: string
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'ממתין',  cls: 'bg-yellow-900/40 text-yellow-300 border-yellow-800' },
  published: { label: 'פורסם', cls: 'bg-green-900/40 text-green-300 border-green-800' },
  failed:    { label: 'נכשל',  cls: 'bg-red-900/40 text-red-300 border-red-800' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function Publisher() {
  const { instagramToken, setInstagramToken, currentScript } = useStore()
  const [tokenInput, setTokenInput] = useState(instagramToken)
  const [tokenStatus, setTokenStatus] = useState<string | null>(null)
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      caption: currentScript?.content.split('\n').slice(0, 3).join('\n') ?? '',
      scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
    },
  })

  const { data: queue = [], isLoading } = useQuery<Post[]>({
    queryKey: ['queue'],
    queryFn: () => apiGet('/instagram/queue'),
    refetchInterval: 15_000,
  })

  const scheduleMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiPost('/instagram/schedule', {
        caption: data.caption,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        scriptId: currentScript?.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue'] })
      reset()
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/instagram/publish/${id}`, {}),
    onMutate: async (id) => {
      qc.setQueryData(['queue'], (old: Post[] = []) =>
        old.map((p) => p.id === id ? { ...p, status: 'published' as const, publishedAt: new Date().toISOString() } : p)
      )
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/instagram/queue/${id}`),
    onMutate: async (id) => {
      qc.setQueryData(['queue'], (old: Post[] = []) => old.filter((p) => p.id !== id))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  })

  const testToken = async () => {
    if (!tokenInput) { setTokenStatus('❌ הכניסי טוקן'); return }
    setInstagramToken(tokenInput)
    setTokenStatus('⏳ בודקת...')
    try {
      const res = await fetch(`https://graph.instagram.com/me?fields=username,followers_count&access_token=${tokenInput}`)
      const d = await res.json()
      if (d.username) setTokenStatus(`✅ @${d.username} · ${(d.followers_count ?? 0).toLocaleString()} עוקבות`)
      else setTokenStatus(`❌ ${d.error?.message ?? 'שגיאה'}`)
    } catch { setTokenStatus('⚠️ שגיאת רשת') }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">פרסום 📤</h1>
        <p className="text-sm text-gray-400 mt-1">חברי את Instagram, תזמני פוסטים, פרסמי בלחיצה</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Right — token + form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Token */}
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
            <h2 className="font-semibold text-gray-200 flex items-center gap-2"><span>🔑</span> חיבור Instagram</h2>
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Instagram Access Token..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-purple-500"
                dir="ltr"
              />
              <button
                onClick={testToken}
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                בדקי
              </button>
            </div>
            {tokenStatus && (
              <p className={`text-xs ${tokenStatus.startsWith('✅') ? 'text-green-400' : tokenStatus.startsWith('❌') ? 'text-red-400' : 'text-gray-400'}`}>
                {tokenStatus}
              </p>
            )}
            <div className="text-xs text-gray-600 leading-relaxed">
              קבלת טוקן: developers.facebook.com → My Apps → Instagram Basic Display API → Tools
            </div>
          </div>

          {/* Schedule form */}
          <form
            onSubmit={handleSubmit((d) => scheduleMutation.mutate(d))}
            className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3"
          >
            <h2 className="font-semibold text-gray-200 flex items-center gap-2"><span>📅</span> תזמון פוסט</h2>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Caption</label>
              <textarea
                {...register('caption', { required: 'חובה' })}
                placeholder="טקסט לפוסט..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                rows={4}
                dir="rtl"
              />
              {errors.caption && <p className="text-red-400 text-xs mt-1">{errors.caption.message}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">תאריך ושעה</label>
              <input
                type="datetime-local"
                {...register('scheduledAt', { required: 'חובה' })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={scheduleMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {scheduleMutation.isPending ? <><span className="animate-spin">⏳</span> מתזמנת...</> : <><span>📅</span> הוסיפי לתור</>}
            </button>
          </form>
        </div>

        {/* Left — queue */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <span className="font-semibold text-gray-200 flex items-center gap-2"><span>🗓️</span> תור פרסום</span>
              {queue.length > 0 && <span className="text-xs text-gray-500">{queue.length} פוסטים</span>}
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                <p>טוענת...</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p>אין פוסטים בתור</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-800">
                {queue.map((post) => {
                  const s = statusLabel[post.status] ?? statusLabel.pending
                  return (
                    <li key={post.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{post.caption}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500">📅 {formatDate(post.scheduledAt)}</span>
                            {post.publishedAt && (
                              <span className="text-xs text-gray-500">✅ {formatDate(post.publishedAt)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                          <div className="flex gap-1">
                            {post.status === 'pending' && (
                              <button
                                onClick={() => publishMutation.mutate(post.id)}
                                disabled={publishMutation.isPending}
                                className="bg-green-700 hover:bg-green-600 text-white text-xs px-2.5 py-1 rounded-lg transition-colors"
                              >
                                פרסמי ✓
                              </button>
                            )}
                            <button
                              onClick={() => deleteMutation.mutate(post.id)}
                              className="bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
