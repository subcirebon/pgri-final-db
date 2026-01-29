import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './Dashboard';
import Login from './Login'; // Import Login baru kamu
import Members from './Members';
import Finance from './Finance';
import Letters from './Letters';
import Donations from './Donations';
import Info from './Info';
import Advocacy from './Advocacy';
import Counseling from './Counseling';
import Profile from './Profile';

function App() {
  // STATE LOGIN
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user'); // Default 'user'
  const [userName, setUserName] = useState('');     // Menyimpan Nama Asli

  // Cek Session saat Refresh (Agar tidak logout sendiri)
  useEffect(() => {
    const storedAuth = localStorage.getItem('pgri_auth');
    const storedRole = localStorage.getItem('pgri_role');
    const storedName = localStorage.getItem('pgri_name');

    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setUserRole(storedRole || 'user');
      setUserName(storedName || 'Anggota');
    }
  }, []);

  // FUNGSI LOGIN (Dipanggil oleh Login.tsx)
  const handleLogin = (role: string, name: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name);

    // Simpan ke Browser
    localStorage.setItem('pgri_auth', 'true');
    localStorage.setItem('pgri_role', role);
    localStorage.setItem('pgri_name', name);
  };

  // FUNGSI LOGOUT
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('user');
    setUserName('');
    localStorage.clear();
  };

  return (
    <Routes>
      {/* Route Login */}
      <Route 
        path="/login" 
        element={
          !isAuthenticated ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      {/* Route Utama (Protected) */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Layout 
              onLogout={handleLogout} 
              userRole={userRole} 
              userName={userName} // Kirim Nama ke Layout
            /> 
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="finance" element={<Finance />} />
        <Route path="letters" element={<Letters />} />
        <Route path="donations" element={<Donations />} />
        <Route path="news" element={<Info />} />
        <Route path="advocacy" element={<Advocacy />} />
        <Route path="counseling" element={<Counseling />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;