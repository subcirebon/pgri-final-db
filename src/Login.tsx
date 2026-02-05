import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient'; // <-- Pastikan nama file ini sesuai dengan file supabase bapak
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (role: string, name: string, id: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [npa, setNpa] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Cek User ke Database Supabase
      // Asumsi: Nama tabel adalah 'members' dan kolom login pakai 'npa'
      const { data, error: dbError } = await supabase
        .from('members')
        .select('*')
        .eq('npa', npa)
        .single();

      if (dbError || !data) {
        throw new Error('NPA tidak ditemukan atau salah.');
      }

      // 2. Cek Password (Sederhana dulu)
      // Nanti bisa dikembangkan pakai hashing kalau sudah mahir
      if (data.password !== password && data.nik !== password) { // Bisa login pakai password atau NIK sementara
        throw new Error('Password salah.');
      }

      // 3. Login Berhasil
      // Panggil fungsi dari App.tsx untuk simpan status login
      onLogin(data.role || 'user', data.name, data.id);
      
      // Arahkan ke Dashboard
      navigate('/');
      
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        
        {/* LOGO & JUDUL */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">PGRI Kalijaga</h1>
          <p className="text-gray-500 mt-2">Silakan login untuk masuk ke aplikasi</p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Input NPA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Anggota (NPA)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={npa}
                onChange={(e) => setNpa(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 border"
                placeholder="Masukkan NPA Anda"
              />
            </div>
          </div>

          {/* Input Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password / NIK</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 border"
                placeholder="Masukkan Password"
              />
            </div>
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {loading ? 'Memproses...' : (
              <>
                <LogIn className="w-4 h-4 mr-2" /> Masuk Aplikasi
              </>
            )}
          </button>
        </form>

        {/* Link Register */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Daftar di sini
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;