import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Dashboard from '@/features/dashboard/Dashboard';
import NotFound from '@/features/NotFound';
import { AppShell } from './layout/AppShell';

// Everything except the dashboard is split into its own chunk.
const Roadmap = lazy(() => import('@/features/roadmap/Roadmap'));
const ModulePage = lazy(() => import('@/features/lesson/ModulePage'));
const LessonPage = lazy(() => import('@/features/lesson/LessonPage'));
const Bookmarks = lazy(() => import('@/features/bookmarks/Bookmarks'));

export default function App() {
  return (
    // BASE_URL is "/gitmasteracademy/" in production builds; strip the trailing slash for the router.
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="learn/:moduleId" element={<ModulePage />} />
          <Route path="learn/:moduleId/:slug" element={<LessonPage />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
