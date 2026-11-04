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
const TerminalPage = lazy(() => import('@/features/terminal/TerminalPage'));
const VisualizerPage = lazy(() => import('@/features/visualizer/VisualizerPage'));
const QuizList = lazy(() => import('@/features/quiz/QuizList'));
const QuizRunner = lazy(() => import('@/features/quiz/QuizRunner'));
const ProjectsList = lazy(() => import('@/features/reference/ProjectsPages').then((m) => ({ default: m.ProjectsList })));
const ProjectPage = lazy(() => import('@/features/reference/ProjectsPages').then((m) => ({ default: m.ProjectPage })));
const CheatSheetPage = lazy(() => import('@/features/reference/CheatSheetPage'));
const GlossaryPage = lazy(() => import('@/features/reference/GlossaryPage'));
const ResourcesPage = lazy(() => import('@/features/reference/ResourcesPage'));

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
          <Route path="terminal" element={<TerminalPage />} />
          <Route path="visualizer" element={<VisualizerPage />} />
          <Route path="quizzes" element={<QuizList />} />
          <Route path="quizzes/:quizId" element={<QuizRunner />} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="projects/:slug" element={<ProjectPage />} />
          <Route path="cheatsheet" element={<CheatSheetPage />} />
          <Route path="glossary" element={<GlossaryPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
