import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Login from './Login';

// --- IMPORT SEMUA FILE ASLI ---
import Dashboard from './Dashboard'; 
import Members from './Members';     
import Letters from './Letters';    
import Finance from './Finance'; 
import Donations from './Donations';
import Advocacy from './Advocacy';
import Counseling from './Counseling';
import Info from './Info';
import Profile from './Profile';

function App() {
  // --- STATE DENGAN LAZY INIT (Agar Tahan Refresh) ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('pgri_auth') === 'true';
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('pgri_role') || 'user';
  });

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('pgri_name') || 'Anggota';
  });

  // --- PERBAIKAN DI SINI: MENERIMA ID USER ---
  const handleLogin = (role: string, name: string, id: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name);
    
    // Simpan data penting ke browser
    localStorage.setItem('pgri_auth', 'true');
    localStorage.setItem('pgri_role', role);
    localStorage.setItem('pgri_name', name);
    localStorage.setItem('pgri_user_id', id.toString()); // <--- INI KUNCINYA (Simpan ID)
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('user');
    setUserName('');
    localStorage.clear(); 
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/" 
        element={isAuthenticated ? <Layout onLogout={handleLogout} userRole={userRole} userName={userName} /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="letters" element={<Letters />} />
        <Route path="finance" element={<Finance />} />
        <Route path="donations" element={<Donations />} />
        <Route path="advocacy" element={<Advocacy />} />
        <Route path="counseling" element={<Counseling />} />
        <Route path="news" element={<Info />} />
        <Route path="about" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;