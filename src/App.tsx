import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Login from './Login';

// --- BAGIAN INI YANG PENTING: KITA PANGGIL FILE ASLINYA ---
import Dashboard from './Dashboard'; 
import Members from './Members';     
import Letters from './Letters';    // <--- INI KUNCINYA (Kabel disambungkan ke Letters.tsx)
import Info from './Info';
import Profile from './Profile';

// --- KOMPONEN SEMENTARA (Hanya untuk halaman yang BENAR-BENAR belum dibuat) ---
const Finance = () => <div className="p-8"><h1 className="text-2xl font-bold">Keuangan</h1><p>Modul ini sedang dikembangkan.</p></div>;
const Donations = () => <div className="p-8"><h1 className="text-2xl font-bold">Dana Sosial</h1><p>Modul ini sedang dikembangkan.</p></div>;
const Advocacy = () => <div className="p-8"><h1 className="text-2xl font-bold">Advokasi</h1><p>Modul ini sedang dikembangkan.</p></div>;
const Counseling = () => <div className="p-8"><h1 className="text-2xl font-bold">Konseling</h1><p>Modul ini sedang dikembangkan.</p></div>;

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
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/" 
        element={isAuthenticated ? <Layout onLogout={handleLogout} userRole={userRole} userName={userName} /> : <Navigate to="/login" replace />}
      >
        {/* Routing ke Komponen Asli */}
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="letters" element={<Letters />} /> {/* Sekarang akan membuka file Letters.tsx */}
        <Route path="news" element={<Info />} />
        <Route path="about" element={<Profile />} />

        {/* Routing ke Komponen Sementara */}
        <Route path="finance" element={<Finance />} />
        <Route path="donations" element={<Donations />} />
        <Route path="advocacy" element={<Advocacy />} />
        <Route path="counseling" element={<Counseling />} />
      </Route>
    </Routes>
  );
}

export default App;