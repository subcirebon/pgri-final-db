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
  const [userName, setUserName] = useState(''); // BARU: State untuk Nama User
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem('pgri_login');
    const role = localStorage.getItem('pgri_role');
    const name = localStorage.getItem('pgri_name'); // BARU: Ambil nama dari penyimpanan
    
    if (loggedIn === 'true' && role) {
      setIsAuthenticated(true);
      setUserRole(role);
      setUserName(name || 'GURU'); // Set nama jika ada
    }
    setIsChecking(false);
  }, []);

  const handleLogin = (role: string, name: string) => { // BARU: Terima parameter name
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name); // Simpan nama ke state
    localStorage.setItem('pgri_login', 'true');
    localStorage.setItem('pgri_role', role);
    localStorage.setItem('pgri_name', name); // Simpan nama ke local storage
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      setIsAuthenticated(false);
      setUserRole('');
      setUserName('');
      localStorage.removeItem('pgri_login');
      localStorage.removeItem('pgri_role');
      localStorage.removeItem('pgri_name'); // BARU: Hapus nama saat logout
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
        {/* Sekarang kita kirim userRole DAN userName ke Layout */}
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