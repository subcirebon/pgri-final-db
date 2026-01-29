import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Login from './Login';
// Halaman yang SUDAH PASTI ADA
import Info from './Info';
import Profile from './Profile';

// --- KOMPONEN SEMENTARA (Agar tidak blank) ---
// Kita pakai ini dulu sampai bapak siap membuat file aslinya satu per satu
const Dashboard = () => <div className="p-8"><h1 className="text-2xl font-bold">Dashboard</h1><p>Halaman ini belum dibuat.</p></div>;
const Members = () => <div className="p-8"><h1 className="text-2xl font-bold">Data Anggota</h1><p>Halaman ini belum dibuat.</p></div>;
const Finance = () => <div className="p-8"><h1 className="text-2xl font-bold">Keuangan</h1><p>Halaman ini belum dibuat.</p></div>;
const Letters = () => <div className="p-8"><h1 className="text-2xl font-bold">Surat Menyurat</h1><p>Halaman ini belum dibuat.</p></div>;
const Donations = () => <div className="p-8"><h1 className="text-2xl font-bold">Dana Sosial</h1><p>Halaman ini belum dibuat.</p></div>;
const Advocacy = () => <div className="p-8"><h1 className="text-2xl font-bold">Advokasi</h1><p>Halaman ini belum dibuat.</p></div>;
const Counseling = () => <div className="p-8"><h1 className="text-2xl font-bold">Konseling</h1><p>Halaman ini belum dibuat.</p></div>;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('');

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
        <Route path="finance" element={<Finance />} />
        <Route path="letters" element={<Letters />} />
        <Route path="donations" element={<Donations />} />
        <Route path="news" element={<Info />} />
        <Route path="advocacy" element={<Advocacy />} />
        <Route path="counseling" element={<Counseling />} />
        <Route path="about" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;