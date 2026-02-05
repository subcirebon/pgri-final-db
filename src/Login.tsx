import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient'; 
import { Lock, LogIn, AlertCircle, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: (role: string, name: string, id: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Cari data berdasarkan email
      const { data, error: dbError } = await supabase
        .from('members')
        .select('*')
        .eq('email', email)
        .single();

      if (dbError || !data) {
        throw new Error('Email tidak ditemukan.');
      }

      // 2. Cek Password
      if (data.password !== password) {
        throw new Error('Password salah.');
      }

      // 3. Login Berhasil - BACA KOLOM 'full_name'
      // Perhatikan: data.full_name (sesuai database Bapak)
      onLogin(data.role || 'user', data.full_name || 'Anggota', data.id);
      
      navigate('/');
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">PGRI Kalijaga</h1>
          <p className="text-gray-500 mt-2">Masuk Aplikasi</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-2 border rounded-md" placeholder="nama@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 p-2 border rounded-md" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          Belum punya akun? <Link to="/register" className="text-blue-600">Daftar</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;