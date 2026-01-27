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
  const [userRole, setUserRole] = useState(''); 
  const [userName, setUserName] = useState(''); // State untuk Nama
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem('pgri_login');
    const role = localStorage.getItem('pgri_role');
    const name = localStorage.getItem('pgri_name'); // Ambil nama
    
    if (loggedIn === 'true' && role) {
      setIsAuthenticated(true);
      setUserRole(role);
      setUserName(name || 'PENGURUS'); 
    }
    setIsChecking(false);
  }, []);

  const handleLogin = (role: string, name: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name); 
    localStorage.setItem('pgri_login', 'true');
    localStorage.setItem('pgri_role', role);
    localStorage.setItem('pgri_name', name); // Simpan nama secara permanen
  };

  const handleLogout = () => {
    if (window.confirm('Keluar aplikasi?')) {
      setIsAuthenticated(false);
      localStorage.clear(); // Bersihkan semua memori
      window.location.href = "/";
    }
  };

  if (isChecking) return null;
  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Mengirimkan data ke Layout */}
        <Route path="/" element={<Layout onLogout={handleLogout} userRole={userRole} userName={userName} />}>
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