import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Login from './Login';

// --- IMPORT FILE ASLI (Agar nyambung ke file yang sudah Bapak buat) ---
import Dashboard from './Dashboard'; // Mengambil dari src/Dashboard.tsx
import Members from './Members';     // Mengambil dari src/Members.tsx
import Info from './Info';
import Profile from './Profile';

// --- KOMPONEN SEMENTARA (Hanya untuk halaman yang BENAR-BENAR belum ada filenya) ---
// Jika nanti Bapak buat file 'Finance.tsx', baris Finance di bawah ini dihapus & diganti import
const Finance = () => <div className="p-8"><h1 className="text-2xl font-bold">Keuangan</h1><p>Modul ini sedang dikembangkan.</p></div>;
const Letters = () => <div className="p-8"><h1 className="text-2xl font-bold">Surat Menyurat</h1><p>Modul ini sedang dikembangkan.</p></div>;
const Donations = () => <div className="p-8"><h1 className="text-2xl font-bold">Dana Sosial</h1><p>Modul ini sedang dikembangkan.</p></div>;
const Advocacy = () => <div className="p-8"><h1 className="text-2xl font-bold">Advokasi</h1><p>Modul ini sedang dikembangkan.</p></div>;
const Counseling = () => <div className="p-8"><h1 className="text-2xl font-bold">Konseling</h1><p>Modul ini sedang dikembangkan.</p></div>;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Cek apakah user sudah login sebelumnya (disimpan di browser)
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
    // Simpan status login
    localStorage.setItem('pgri_auth', 'true');
    localStorage.setItem('pgri_role', role);
    localStorage.setItem('pgri_name', name);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('user');
    setUserName('');
    localStorage.clear(); // Hapus semua data login saat keluar
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
        {/* Routing ke Komponen Asli */}
        <Route index element={<Dashboard />} />      {/* Ke src/Dashboard.tsx */}
        <Route path="members" element={<Members />} /> {/* Ke src/Members.tsx */}
        
        {/* Routing ke Komponen Lain */}
        <Route path="news" element={<Info />} />
        <Route path="about" element={<Profile />} />

        {/* Routing ke Komponen Sementara (Dummy) */}
        <Route path="finance" element={<Finance />} />
        <Route path="letters" element={<Letters />} />
        <Route path="donations" element={<Donations />} />
        <Route path="advocacy" element={<Advocacy />} />
        <Route path="counseling" element={<Counseling />} />
      </Route>
    </Routes>
  );
}

export default App;