import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Chargement...</div>
      </div>
    );
  }

  if (window.location.pathname === '/admin') {
    if (!isAdminLoggedIn) {
      return <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />;
    }
    return <AdminDashboard onLogout={() => {
      setIsAdminLoggedIn(false);
      window.location.pathname = '/';
    }} />;
  }

  return user ? <Dashboard /> : <AuthForm />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
