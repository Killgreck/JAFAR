import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { CreateBet } from './pages/CreateBet';
import { BetsList } from './pages/BetsList';
import { CreateEvent } from './pages/CreateEvent';
import { EventsList } from './pages/EventsList';
import { EventEvidence } from './pages/EventEvidence';
import { EventManagement } from './pages/EventManagement';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-bet"
            element={
              <ProtectedRoute>
                <CreateBet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bets"
            element={
              <ProtectedRoute>
                <BetsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-event"
            element={
              <ProtectedRoute>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/evidence"
            element={
              <ProtectedRoute>
                <EventEvidence />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/manage"
            element={
              <ProtectedRoute>
                <EventManagement />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
