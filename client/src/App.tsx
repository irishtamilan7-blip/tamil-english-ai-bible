import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ReadPage from './pages/ReadPage'
import SearchPage from './pages/SearchPage'
import BookmarksPage from './pages/BookmarksPage'
import MorePage from './pages/MorePage'
import TestamentPage from './pages/TestamentPage'
import BookPage from './pages/BookPage'
import SettingsPage from './pages/SettingsPage'
import CharactersPage from './pages/CharactersPage'
import QuizPage from './pages/QuizPage'
import WeeklyTopicsPage from './pages/WeeklyTopicsPage'
import NotesPage from './pages/NotesPage'
import HighlightsPage from './pages/HighlightsPage'
import AboutPage from './pages/AboutPage'
import AskAIPage from './pages/AskAIPage'
import ReadingPlanPage from './pages/ReadingPlanPage'

export default function App() {
  const { theme } = useAppStore()

  useEffect(() => {
    document.body.className = theme === 'light' ? '' : `theme-${theme}`
  }, [theme])

  useEffect(() => {
    const update = () => useAppStore.getState().setOfflineMode(!navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    update()
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/read" element={<ReadPage />} />
        <Route path="/read/:bookId/:chapterNo" element={<ReadPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/testament/:type" element={<TestamentPage />} />
        <Route path="/book/:bookId" element={<BookPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/topics" element={<WeeklyTopicsPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/highlights" element={<HighlightsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/ai" element={<AskAIPage />} />
        <Route path="/plan" element={<ReadingPlanPage />} />
      </Route>
    </Routes>
  )
}
