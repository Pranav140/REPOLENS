import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import RepoLayout from './pages/repo/RepoLayout'
import Overview from './pages/repo/Overview'
import Graph from './pages/repo/Graph'
import Health from './pages/repo/Health'
import Search from './pages/repo/Search'
import Security from './pages/repo/Security'
import AI from './pages/repo/AI'
import Dependencies from './pages/repo/Dependencies'
import BlastRadius from './pages/repo/BlastRadius'
import OnboardingEstimate from './pages/repo/OnboardingEstimate'
import { useAuth } from './hooks/useAuth'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null // still loading
  return isAuthenticated ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/repo/:owner/:name" element={
          <PrivateRoute><RepoLayout /></PrivateRoute>
        }>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="graph" element={<Graph />} />
          <Route path="health" element={<Health />} />
          <Route path="search" element={<Search />} />
          <Route path="security" element={<Security />} />
          <Route path="ai" element={<AI />} />
          <Route path="dependencies" element={<Dependencies />} />
          <Route path="blast-radius" element={<BlastRadius />} />
          <Route path="onboarding-estimate" element={<OnboardingEstimate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
