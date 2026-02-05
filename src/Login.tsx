import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Lock, Mail, AlertCircle } from 'lucide-react';

// URL Logo PGRI (Publik)
const PGRI_LOGO_URL = "https://vuzwlgwzhiuosgeohhjl.supabase.co/storage/v1/object/public/asset/Persatuan_Guru_Republik_Indonesia.png";

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
      // 1. Cari data berdasarkan email di tabel 'members'
      const { data, error: dbError } = await supabase
        .from('members')
        .select('*')
        .eq('email', email)
        .single();

      if (dbError || !data) {
        throw new Error('Email tidak ditemukan.');
      }

      // 2. Cek Password secara manual
      // (Catatan: Ini sementara. Idealnya nanti pakai Supabase Auth)
      if (data.password !== password) {
        throw new Error('Password salah.');
      }

      // 3. Login Berhasil - Ambil 'full_name'
      onLogin(data.role || 'user', data.full_name || 'Anggota', data.id);
      navigate('/');
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal login. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* --- BAGIAN ATAS: HEADER MERAH & LOGO --- */}
        <div className="bg-[#C2272D] py-10 px-6 text-center">
          <img 
            src={PGRI_LOGO_URL} 
            alt="Logo PGRI" 
            className="h-24 w-auto mx-auto mb-6 filter brightness-0 invert drop-shadow-md" 
          />
          <h1 className="text-2xl font-extrabold text-white tracking-wider drop-shadow-sm">
            PGRI RANTING KALIJAGA
          </h1>
          <p className="text-red-100 mt-2 text-sm font-medium tracking-wide">
            Silahkan Masuk
          </p>
        </div>

        {/* --- BAGIAN BAWAH: FORM PUTIH --- */}
        <div className="p-8 pt-10">
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-[#C2272D] p-4 flex items-center rounded-md">
              <AlertCircle className="w-5 h-5 text-[#C2272D] mr-3" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Input Email */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#C2272D] transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 block w-full py-3.5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C2272D] focus:border-transparent focus:bg-white transition-all duration-200 sm:text-sm"
                placeholder="Email Anda"
              />
            </div>

            {/* Input Password */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#C2272D] transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 block w-full py-3.5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C2272D] focus:border-transparent focus:bg-white transition-all duration-200 sm:text-sm"
                placeholder="Password"
              />
            </div>

            {/* Tombol Login Merah Bulat */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-lg text-sm font-bold text-white bg-[#C2272D] hover:bg-red-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C2272D] disabled:bg-gray-300 disabled:shadow-none transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Link Daftar Merah Kecil */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Belum punya akun?{' '}
              <Link to="/register" className="font-bold text-[#C2272D] hover:text-red-800 hover:underline transition-colors">
                DAFTAR
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;