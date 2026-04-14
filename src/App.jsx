import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout       from './components/Layout'
import Login        from './pages/Login'
import Fleet        from './pages/Fleet'
import Devices      from './pages/Devices'
import Species      from './pages/Species'
import Cultivations from './pages/Cultivations'
import Hardware     from './pages/Hardware'
import DataExplorer from './pages/DataExplorer'
import Photos       from './pages/Photos'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index              element={<Fleet />} />
          <Route path="devices"     element={<Devices />} />
          <Route path="species"     element={<Species />} />
          <Route path="cultivations" element={<Cultivations />} />
          <Route path="hardware"    element={<Hardware />} />
          <Route path="data"        element={<DataExplorer />} />
          <Route path="photos"      element={<Photos />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
