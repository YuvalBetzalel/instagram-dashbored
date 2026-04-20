import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'

const Library    = lazy(() => import('./pages/Library'))
const Studio     = lazy(() => import('./pages/Studio'))
const CapCut     = lazy(() => import('./pages/CapCut'))
const Carousel   = lazy(() => import('./pages/Carousel'))
const VideoEditor = lazy(() => import('./pages/VideoEditor'))
const Publisher  = lazy(() => import('./pages/Publisher'))
const Analytics  = lazy(() => import('./pages/Analytics'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-gray-500 text-sm gap-2">
      <span className="animate-spin">⏳</span> טוענת...
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="dark min-h-screen bg-gray-950 text-gray-100 font-sans" dir="rtl">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/library" replace />} />
              <Route path="library"   element={<Suspense fallback={<PageLoader />}><Library /></Suspense>} />
              <Route path="studio"    element={<Suspense fallback={<PageLoader />}><Studio /></Suspense>} />
              <Route path="capcut"    element={<Suspense fallback={<PageLoader />}><CapCut /></Suspense>} />
              <Route path="carousel"  element={<Suspense fallback={<PageLoader />}><Carousel /></Suspense>} />
              <Route path="video"     element={<Suspense fallback={<PageLoader />}><VideoEditor /></Suspense>} />
              <Route path="publisher" element={<Suspense fallback={<PageLoader />}><Publisher /></Suspense>} />
              <Route path="analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
