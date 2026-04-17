import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { uploadFile, apiGet, apiDelete } from '../api/client'
import { useStore, MediaItem } from '../store'

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function MediaCard({ item, selected, onToggle, onDelete }: {
  item: MediaItem
  selected: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const tags: string[] = (() => { try { return JSON.parse(item.tags) } catch { return [] } })()
  const isVideo = item.mimetype.startsWith('video/')
  const src = `/api/uploads/${item.path}`

  return (
    <div
      className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
        selected ? 'border-purple-500 shadow-lg shadow-purple-900/40' : 'border-gray-800 hover:border-gray-600'
      }`}
      onClick={onToggle}
    >
      <div className="aspect-square bg-gray-800 relative">
        {isVideo ? (
          <video src={src} className="w-full h-full object-cover" muted />
        ) : (
          <img src={src} alt={item.filename} className="w-full h-full object-cover" loading="lazy" />
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 rounded-full p-2 text-xl">▶</div>
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
            <div className="bg-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-lg">✓</div>
          </div>
        )}
      </div>
      <div className="p-2 bg-gray-900">
        <div className="text-xs text-gray-300 truncate">{item.filename}</div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-500">{formatSize(item.size)}</span>
          {tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {tags.slice(0, 2).map((t) => (
                <span key={t} className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="absolute top-1 left-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}

export default function Library() {
  const [tagFilter, setTagFilter] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const { selectedMedia, toggleMediaSelection, setSelectedMedia } = useStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: media = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ['media', tagFilter],
    queryFn: () => apiGet(tagFilter ? `/media?tags=${encodeURIComponent(tagFilter)}` : '/media'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/media/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['media'] })
      qc.setQueryData(['media', tagFilter], (old: MediaItem[] = []) => old.filter((m) => m.id !== id))
      setSelectedMedia(selectedMedia.filter((m) => m.id !== id))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['media'] }),
  })

  const onDrop = useCallback(async (files: File[]) => {
    setUploading(true)
    try {
      for (const file of files) {
        await uploadFile(file, tagInput || undefined)
      }
      qc.invalidateQueries({ queryKey: ['media'] })
    } finally {
      setUploading(false)
    }
  }, [tagInput, qc])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    multiple: true,
  })

  const allTags = [...new Set(media.flatMap((m) => { try { return JSON.parse(m.tags) } catch { return [] } }))]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">ספרייה 🖼️</h1>
          <p className="text-sm text-gray-400 mt-1">העלי מדיה, תייגי, ובחרי לפייפליין</p>
        </div>
        {selectedMedia.length > 0 && (
          <button
            onClick={() => navigate('/studio')}
            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/30"
          >
            <span>🎬</span>
            {selectedMedia.length} נבחרו — פתחי סטודיו
          </button>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="space-y-2">
            <div className="text-3xl animate-bounce">⬆️</div>
            <p className="text-gray-300 font-medium">מעלה...</p>
          </div>
        ) : isDragActive ? (
          <div className="space-y-2">
            <div className="text-4xl">📂</div>
            <p className="text-purple-300 font-medium">שחרר להעלאה</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">📸</div>
            <p className="text-gray-300 font-medium">גרור תמונות/סרטונים לכאן</p>
            <p className="text-gray-500 text-sm">או לחצי לבחירה — JPEG, PNG, MP4, MOV עד 100MB</p>
            <div className="flex items-center gap-2 justify-center">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="תגיות (מופרדות בפסיק)"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-purple-500 w-48"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTagFilter('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!tagFilter ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            הכל
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${tagFilter === tag ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg">הספרייה ריקה — העלי את הקובץ הראשון</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              selected={selectedMedia.some((m) => m.id === item.id)}
              onToggle={() => toggleMediaSelection(item)}
              onDelete={() => deleteMutation.mutate(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
