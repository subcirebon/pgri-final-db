import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Login from './Login';

// --- IMPORT SEMUA FILE ASLI (FULL TEAM) ---
import Dashboard from './Dashboard'; 
import Members from './Members';     
import Letters from './Letters';    
import Finance from './Finance'; 
import Donations from './Donations';
import Advocacy from './Advocacy';     // <--- KABEL DISAMBUNGKAN
import Counseling from './Counseling'; // <--- KABEL DISAMBUNGKAN
import Info from './Info';
import Profile from './Profile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Cek apakah user sudah login sebelumnya
    const storedAuth = localStorage.getItem('pgri_auth');
    const storedRole = localStorage.getItem('pgri_role');
    const storedName = localStorage.getItem('pgri_name');

    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setUserRole(storedRole || 'user');
      setUserName(storedName || 'Anggota');
    }
  }, []);

  const handleLogin = (role: string, name: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name);
    localStorage.setItem('pgri_auth', 'true');
    localStorage.setItem('pgri_role', role);
    localStorage.setItem('pgri_name', name);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('user');
    setUserName('');
    localStorage.clear(); 
  };

  return (
    <Routes>
      {/* Halaman Login */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} 
      />

      {/* Halaman Utama (Perlu Login) */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Layout onLogout={handleLogout} userRole={userRole} userName={userName} /> : <Navigate to="/login" replace />}
      >
        {/* SEMUA ROUTING SEKARANG MENGARAH KE FILE ASLI */}
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="letters" element={<Letters />} />
        <Route path="finance" element={<Finance />} />
        <Route path="donations" element={<Donations />} />
        <Route path="advocacy" element={<Advocacy />} />   {/* Sudah Aktif */}
        <Route path="counseling" element={<Counseling />} /> {/* Sudah Aktif */}
        <Route path="news" element={<Info />} />
        <Route path="about" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;