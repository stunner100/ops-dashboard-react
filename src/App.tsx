import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AIAssistantProvider } from './context/AIAssistantContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout';
import { AIAssistant } from './components/AIAssistant';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { OverviewBoard } from './pages/OverviewBoard';
import { KPIBoard } from './pages/KPIBoard';
import { SOPLibrary } from './pages/SOPLibrary';
import { TeamChat } from './pages/TeamChat';
import { Notifications } from './pages/Notifications';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewBoard />} />
        <Route path="kpi" element={<KPIBoard />} />
        <Route path="sop" element={<SOPLibrary />} />
        <Route path="chat" element={<TeamChat />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AIAssistantProvider>
            <AppRoutes />
            <AIAssistant />
          </AIAssistantProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

