import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { apiGet } from '../api/client'
import { useStore } from '../store'

interface Insights {
  followers: number
  mediaCount: number
  engagementRate: number
  username: string
  bestHours: { hour: number; avgEngagement: number }[]
  recentPosts: { id: string; likes: number; comments: number; timestamp: string; type: string }[]
}

const engagementHistory = [
  { week: 'שבוע 1', engagement: 3.8 },
  { week: 'שבוע 2', engagement: 4.1 },
  { week: 'שבוע 3', engagement: 3.9 },
  { week: 'שבוע 4', engagement: 4.7 },
  { week: 'שבוע 5', engagement: 5.1 },
  { week: 'שבוע 6', engagement: 4.9 },
]

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color ?? 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

export default function Analytics() {
  const { data, isLoading } = useQuery<Insights>({
    queryKey: ['insights'],
    queryFn: () => apiGet('/instagram/insights'),
    refetchInterval: 60_000,
    placeholderData: {
      followers: 12480, mediaCount: 156, engagementRate: 4.7, username: 'activewear_il',
      bestHours: Array(24).fill(0).map((_, h) => ({
        hour: h,
        avgEngagement: [2,1,1,1,1,2,5,10,14,16,14,12,10,8,7,8,10,14,22,30,28,20,12,6][h],
      })),
      recentPosts: [
        { id:'1', likes:342, comments:28, timestamp:'2026-04-10T18:00:00Z', type:'REEL' },
        { id:'2', likes:518, comments:45, timestamp:'2026-04-08T19:00:00Z', type:'REEL' },
        { id:'3', likes:289, comments:22, timestamp:'2026-04-06T17:00:00Z', type:'IMAGE' },
      ],
    },
  })

  const selectedCount = useStore((s) => s.selectedMedia.length)
  const hasScript = useStore((s) => !!s.currentScript)

  const maxEng = data ? Math.max(...data.bestHours.map((h) => h.avgEngagement)) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">אנליטיקס 📊</h1>
        <p className="text-sm text-gray-400 mt-1">
          {data?.username ? `@${data.username}` : 'חיבר את Instagram לנתונים אמיתיים'} · מתעדכן כל דקה
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="👥" label="עוקבות" value={isLoading ? '...' : (data?.followers ?? 0).toLocaleString('he-IL')} sub="+ 340 השבוע" color="text-purple-400" />
        <StatCard icon="💜" label="Engagement" value={isLoading ? '...' : `${data?.engagementRate ?? 0}%`} sub="ממוצע נישה: 3.2%" color="text-pink-400" />
        <StatCard icon="📸" label="פוסטים" value={isLoading ? '...' : String(data?.mediaCount ?? 0)} sub="סך הכל" />
        <StatCard icon="🔥" label="שעה הכי טובה" value={!data ? '...' : `${data.bestHours.reduce((best, h) => h.avgEngagement > best.avgEngagement ? h : best, data.bestHours[0]).hour}:00`} sub="שיא מעורבות" color="text-yellow-400" />
      </div>

      {/* Pipeline stats */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <h2 className="font-semibold text-gray-200 mb-4 flex items-center gap-2"><span>⚡</span> מצב Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'מדיה נבחרה', value: selectedCount > 0 ? `${selectedCount} קבצים` : 'לא', done: selectedCount > 0, icon: '🖼️' },
            { label: 'סקריפט', value: hasScript ? 'מוכן ✓' : 'חסר', done: hasScript, icon: '📝' },
            { label: 'CapCut', value: hasScript ? 'זמין' : 'חסר', done: hasScript, icon: '✂️' },
            { label: 'פרסום', value: 'פתוח', done: false, icon: '📤' },
          ].map((step) => (
            <div key={step.label} className={`rounded-xl p-3 border ${step.done ? 'border-green-800 bg-green-900/20' : 'border-gray-800 bg-gray-800/50'}`}>
              <div className="text-xl mb-1">{step.icon}</div>
              <div className="text-xs text-gray-400">{step.label}</div>
              <div className={`text-sm font-semibold mt-1 ${step.done ? 'text-green-400' : 'text-gray-500'}`}>{step.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Engagement trend */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <h2 className="font-semibold text-gray-200 mb-4 flex items-center gap-2"><span>📈</span> מגמת מעורבות</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={engagementHistory} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} domain={[3, 6]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#E5E7EB', fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, 'Engagement']}
              />
              <Line type="monotone" dataKey="engagement" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Best hours heatmap */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <h2 className="font-semibold text-gray-200 mb-4 flex items-center gap-2"><span>⏰</span> שעות פרסום מיטביות</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={data?.bestHours.filter((h) => h.hour >= 6 && h.hour <= 23) ?? []}
              margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fill: '#9CA3AF', fontSize: 9 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 9 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#E5E7EB', fontSize: 11 }}
                labelFormatter={(h) => `${h}:00`}
                formatter={(v: number) => [v, 'מעורבות ממוצעת']}
              />
              <Bar dataKey="avgEngagement" radius={[3, 3, 0, 0]}>
                {(data?.bestHours.filter((h) => h.hour >= 6 && h.hour <= 23) ?? []).map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.avgEngagement === maxEng ? '#ec4899' : entry.avgEngagement >= maxEng * 0.7 ? '#a855f7' : '#374151'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {data && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              🔥 שיא: {data.bestHours.reduce((b, h) => h.avgEngagement > b.avgEngagement ? h : b, data.bestHours[0]).hour}:00
            </p>
          )}
        </div>
      </div>

      {/* Recent posts */}
      {data?.recentPosts && data.recentPosts.length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="font-semibold text-gray-200 flex items-center gap-2"><span>🕐</span> פוסטים אחרונים</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {data.recentPosts.map((post) => (
              <div key={post.id} className="px-4 py-3 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(post.timestamp).toLocaleDateString('he-IL')}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${post.type === 'REEL' ? 'bg-pink-900/40 text-pink-300 border-pink-800' : 'bg-blue-900/40 text-blue-300 border-blue-800'}`}>
                      {post.type === 'REEL' ? 'Reel' : post.type === 'CAROUSEL_ALBUM' ? 'קרוסל' : 'תמונה'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-300 flex items-center gap-1">
                    <span className="text-pink-400">❤️</span> {post.likes.toLocaleString()}
                  </span>
                  <span className="text-gray-300 flex items-center gap-1">
                    <span className="text-blue-400">💬</span> {post.comments.toLocaleString()}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {((post.likes + post.comments) / (data.followers || 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
