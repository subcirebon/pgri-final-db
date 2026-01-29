import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Wallet, 
  Heart, 
  Scale, 
  MessageCircle, 
  Info, 
  Menu, 
  X, 
  LogOut,
  User
} from 'lucide-react';
import { supabase } from './supabaseClient'; // Pastikan import ini ada

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // STATE FOTO PROFIL & NAMA
  const [userProfile, setUserProfile] = useState({
    name: 'Anggota',
    role: 'PGRI Ranting Kalijaga',
    avatar_url: ''
  });

  // FUNGSI AMBIL DATA USER (Supaya Foto Permanen)
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Ganti ID 1 dengan ID user login nanti
      const { data, error } = await supabase
        .from('members')
        .select('name, role, avatar_url')
        .eq('id', 1) 
        .single();

      if (data) {
        setUserProfile({
          name: data.name || 'Anggota',
          role: data.role || 'PGRI Ranting Kalijaga',
          avatar_url: data.avatar_url || '' // Ambil URL dari database
        });
      }
    };

    fetchUserProfile();
  }, []); // Dijalankan sekali saat aplikasi dibuka

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Info, label: 'Info dan Berita', path: '/news' },
    { icon: Users, label: 'Data Anggota', path: '/members' },
    { icon: Wallet, label: 'Keuangan', path: '/finance' },
    { icon: Heart, label: 'Dana Sosial', path: '/donations' },
    { icon: FileText, label: 'Surat Menyurat', path: '/letters' },
    { icon: Scale, label: 'Advokasi Hukum', path: '/advocacy' },
    { icon: MessageCircle, label: 'Konseling', path: '/counseling' },
    { icon: Info, label: 'Tentang Kami', path: '/about' },
  ];

  const handleLogout = () => {
    const confirm = window.confirm('Apakah anda yakin ingin keluar?');
    if (confirm) {
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* SIDEBAR MOBILE OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#991b1b] text-white transform transition-transform duration-200 ease-in-out shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 text-center border-b border-white/10">
          <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-3 shadow-lg overflow-hidden">
             {/* LOGO PGRI */}
             <img src="/logo-pgri.png" alt="PGRI" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">PGRI RANTING KALIJAGA</h1>
          <p className="text-xs text-red-100 mt-1 opacity-80 uppercase tracking-widest">Sistem Administrasi</p>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-white/10 text-white font-bold shadow-sm border-l-4 border-yellow-400' 
                    : 'text-red-100 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-yellow-400' : 'text-red-300 group-hover:text-white'} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-200 hover:bg-red-900/50 hover:text-white transition-colors mt-8"
          >
            <LogOut size={20} />
            <span className="text-sm">Keluar</span>
          </button>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 text-center text-xs text-red-300/60 border-t border-white/5">
          &copy; 2026 PGRI Ranting Kalijaga
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        
        {/* HEADER */}
        <header className="bg-white shadow-sm border-b border-gray-100 h-16 flex items-center justify-between px-6 z-30">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 px-4 lg:px-8">
            <h2 className="text-lg font-bold text-gray-800 hidden md:block">
              Selamat Datang, <span className="text-[#991b1b]">BAPAK & IBU GURU HEBAT!</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* BAGIAN INI YANG DIPERBAIKI: AVATAR DINAMIS */}
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-800">{userProfile.name}</p>
              <p className="text-xs text-gray-500">{userProfile.role}</p>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
              {userProfile.avatar_url ? (
                <img 
                  src={userProfile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                  <User size={20} />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-8">
          <Outlet context={{ userRole: 'admin' }} />
        </main>

      </div>
    </div>
  );
};

export default Layout;