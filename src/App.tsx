import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import UsersPage from './pages/UsersPage';
import CompaniesPage from './pages/CompaniesPage';
import RolesPage from './pages/RolesPage';
import ContentPage from './pages/ContentPage';
import { PermissionGate } from './components/PermissionGate';

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route 
          path="/auth" 
          element={session ? <Navigate to="/" replace /> : <AuthPage />} 
        />
        
        {/* Protected routes */}
        {session ? (
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/users" replace />} />
            <Route 
              path="/users" 
              element={
                <PermissionGate permissions={['users_read']} fallback={<Navigate to="/" />}>
                  <UsersPage />
                </PermissionGate>
              } 
            />
            <Route 
              path="/companies" 
              element={
                <PermissionGate permissions={['companies_read']} fallback={<Navigate to="/" />}>
                  <CompaniesPage />
                </PermissionGate>
              } 
            />
            <Route 
              path="/roles" 
              element={
                <PermissionGate permissions={['roles_read']} fallback={<Navigate to="/" />}>
                  <RolesPage />
                </PermissionGate>
              } 
            />
            <Route 
              path="/content" 
              element={
                <PermissionGate permissions={['content_read']} fallback={<Navigate to="/" />}>
                  <ContentPage />
                </PermissionGate>
              } 
            />
            <Route path="*" element={<Navigate to="/users" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/auth" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;