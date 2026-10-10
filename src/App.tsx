import { Route, Routes, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { AuthPage } from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Placement from './pages/Placement'
import CourseMap from './pages/CourseMap'
import LessonPage from './pages/LessonPage'
import Review from './pages/Review'
import Settings from './pages/Settings'
import Reference from './pages/Reference'
import Compare from './pages/Compare'
import Tenses from './pages/Tenses'
import Connectors from './pages/Connectors'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/reset-password" element={<AuthPage mode="reset" />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/placement" element={<Placement />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/course" element={<CourseMap />} />
          <Route path="/review" element={<Review />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reference" element={<Reference />} />
          <Route path="/reference/latam-vs-spain" element={<Compare />} />
          <Route path="/reference/tenses" element={<Tenses />} />
          <Route path="/reference/connectors" element={<Connectors />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
