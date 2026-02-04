import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom'; // 1. Import Link
import { LogIn, Loader2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (role: string, name: string, id: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Cek User Super Admin (Hardcode)
      if (username === 'admin' && password === 'admin123') {
        onLogin('super_admin', 'SUPER ADMIN', '0'); 
        return;
      }

      // 2. Cek ke Database Supabase (Tabel Members)
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        throw new Error('Username atau Password salah.');
      }

      if (data.account_status !== 'Active') {
        throw new Error('Akun Anda belum diaktifkan oleh Admin.');
      }

      // 3. Login Berhasil
      const role = data.role || 'user'; 
      onLogin(role, data.full_name || data.name, data.id); // Sesuaikan field nama

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in duration-300">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center shadow-inner">
             <img src="/logo-pgri.png" alt="PGRI" className="w-12 h-12 object-contain" onError={(e) => (e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Lambang_PGRI.svg')}/>
          </div>
          <h1 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">PGRI RANTING KALIJAGA</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sistem Informasi & Administrasi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16}/> {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 ml-1">Akses Username</label>
            <input 
              type="text" 
              required
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:border-red-800 focus:bg-white transition-all placeholder:text-gray-300"
              placeholder="Username Anda"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 ml-1">Kata Sandi</label>
            <input 
              type="password" 
              required
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:border-red-800 focus:bg-white transition-all placeholder:text-gray-300"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-800 hover:bg-red-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex justify-center items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={18} /> Masuk Sistem</>}
          </button>
        </form>

        {/* --- BAGIAN INI DIPERBAIKI --- */}
        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">
            Belum punya akun?
          </p>
          <Link 
            to="/register" 
            className="inline-block px-4 py-2 bg-gray-100 text-red-800 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-red-50 hover:text-red-900 transition-colors"
          >
            Daftar Disini
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;