const BASE = '/api'

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
  return res.json()
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`)
}

export async function uploadFile(file: File, tags?: string): Promise<any> {
  const fd = new FormData()
  fd.append('file', file)
  if (tags) fd.append('tags', tags)
  const res = await fetch(`${BASE}/media/upload`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error(`Upload → ${res.status}`)
  return res.json()
}
