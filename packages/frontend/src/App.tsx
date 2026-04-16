import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import Library from './pages/Library'
import Studio from './pages/Studio'
import CapCut from './pages/CapCut'
import Publisher from './pages/Publisher'
import Analytics from './pages/Analytics'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="dark min-h-screen bg-gray-950 text-gray-100 font-sans" dir="rtl">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/library" replace />} />
              <Route path="library" element={<Library />} />
              <Route path="studio" element={<Studio />} />
              <Route path="capcut" element={<CapCut />} />
              <Route path="publisher" element={<Publisher />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
