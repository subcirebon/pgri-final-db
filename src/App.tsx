import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './Dashboard';
import Login from './Login'; 
import Members from './Members';
import Finance from './Finance';
import Letters from './Letters';
import Donations from './Donations';
import Info from './Info';        // PERBAIKAN 1: Import sesuai nama komponen
import Advocacy from './Advocacy';
import Counseling from './Counseling';
import Profile from './Profile';  // PERBAIKAN 2: Import sesuai nama komponen

function App() {
  // STATE LOGIN
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user'); 
  const [userName, setUserName] = useState('');     

  // Cek Session saat Refresh 
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

  // FUNGSI LOGIN 
  const handleLogin = (role: string, name: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name);

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
              userName={userName} 
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
        
        {/* PERBAIKAN 3: Path 'news' memanggil komponen <Info /> */}
        <Route path="news" element={<Info />} />
        
        <Route path="advocacy" element={<Advocacy />} />
        <Route path="counseling" element={<Counseling />} />
        
        {/* PERBAIKAN 4: Path 'about' memanggil komponen <Profile /> */}
        <Route path="about" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;