import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Login from './Login';
import Register from './Register'; 

// --- IMPORT HALAMAN (Perhatikan Nama Filenya!) ---
import Dashboard from './Dashboard'; 
import Letters from './Letters';    
import Finance from './Finance'; 
import Donations from './Donations';
import Advocacy from './Advocacy';
import Counseling from './Counseling';
import Info from './Info';
import Profile from './Profile';

// --- IMPORT DINAMIS (Agar tidak Blank jika file salah nama) ---
// Kita coba import MyCard, kalau tidak ada kita pakai Member
import MyCard from './MyCard'; 
// Jika kamu belum rename, ubah baris atas jadi: import MyCard from './Member';

// Kita coba import AdminDatabase, kalau tidak ada kita pakai Members
import AdminDatabase from './AdminDatabase'; 
// Jika kamu belum rename, ubah baris atas jadi: import AdminDatabase from './Members';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('pgri_auth') === 'true';
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('pgri_role') || 'user';
  });

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('pgri_name') || 'Anggota';
  });

  const handleLogin = (role: string, name: string, id: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name);
    
    localStorage.setItem('pgri_auth', 'true');
    localStorage.setItem('pgri_role', role);
    localStorage.setItem('pgri_name', name);
    localStorage.setItem('pgri_user_id', id.toString());
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
        path="/register" 
        element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/" 
        element={isAuthenticated ? <Layout onLogout={handleLogout} userRole={userRole} userName={userName} /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Dashboard />} />
        
        {/* Halaman Admin */}
        <Route path="members" element={<AdminDatabase />} />
        
        {/* Halaman Kartu Saya */}
        <Route path="my-card" element={<MyCard />} /> 

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