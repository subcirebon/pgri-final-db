import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Members from './Members';
import Finance from './Finance';
import Letters from './Letters';
import Advocacy from './Advocacy';
import Counseling from './Counseling';
import Info from './Info';
import Login from './Login';
import Donations from './Donations';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(''); // State untuk menyimpan Role
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem('pgri_login');
    const role = localStorage.getItem('pgri_role'); // Ambil role dari penyimpanan
    
    if (loggedIn === 'true' && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = (role: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('pgri_login', 'true');
    localStorage.setItem('pgri_role', role); // Simpan role
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      setIsAuthenticated(false);
      setUserRole('');
      localStorage.removeItem('pgri_login');
      localStorage.removeItem('pgri_role');
      window.location.href = "/";
    }
  };

  if (isChecking) return null;

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Kita kirim userRole ke Layout agar bisa diteruskan ke anak-anaknya */}
        <Route path="/" element={<Layout onLogout={handleLogout} userRole={userRole} />}>
          <Route index element={<Dashboard />} />
          <Route path="info" element={<Info />} />
          <Route path="profile" element={<Profile />} />
          <Route path="members" element={<Members />} />
          <Route path="finance" element={<Finance />} />
          <Route path="letters" element={<Letters />} />
          <Route path="advocacy" element={<Advocacy />} />
          <Route path="counseling" element={<Counseling />} />
          <Route path="donations" element={<Donations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;