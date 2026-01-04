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
import { PendingApproval } from './pages/PendingApproval';
import { UserManagement } from './pages/UserManagement';

function ProtectedRoute({ children, requireApproval = true }: { children: React.ReactNode; requireApproval?: boolean }) {
  const { isAuthenticated, isApproved, isAdmin, loading } = useAuth();

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

  // If approval is required and user is not approved (and not admin), redirect to pending page
  if (requireApproval && !isApproved && !isAdmin) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

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

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/pending-approval" element={
        <ProtectedRoute requireApproval={false}>
          <PendingApproval />
        </ProtectedRoute>
      } />
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
        <Route path="admin/users" element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        } />
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
