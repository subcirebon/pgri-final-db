import React, { useState, useEffect, useRef } from 'react'; 
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wallet, Mail, Shield, Info, LogOut, Menu, X, 
  HeartHandshake, Building2, Crown, UserCog, User, Heart, Camera, ChevronDown 
} from 'lucide-react';

const Layout = ({ onLogout, userRole }: { onLogout: () => void, userRole: string }) => {
  // --- STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Untuk menu dropdown profil
  const [profileImage, setProfileImage] = useState<string | null>(null); // Untuk foto profil
  const fileInputRef = useRef<HTMLInputElement>(null); // Referensi ke input file

  // 1. LOAD FOTO PROFIL (Jika ada tersimpan)
  useEffect(() => {
    const savedImage = localStorage.getItem('pgri_profile_image');
    if (savedImage) setProfileImage(savedImage);
  }, []);

  const getRoleLabel = () => {
    if (userRole === 'super_admin') return 'Super Admin';
    if (userRole === 'admin') return 'Administrator';
    return 'Anggota';
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // 2. FUNGSI GANTI FOTO
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
      localStorage.setItem('pgri_profile_image', imageUrl); // Simpan ke browser
      setIsProfileOpen(false); // Tutup menu
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans relative">
      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={toggleSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`w-64 bg-red-800 text-white fixed h-full shadow-xl z-30 transition-transform duration-300 ease-in-out 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
        
        <div className="p-6 border-b border-red-700 flex flex-col items-center text-center">
          <button onClick={toggleSidebar} className="md:hidden absolute right-4 top-4 text-red-200">
            <X size={24} />
          </button>
          
          <div className="bg-white p-2 rounded-full mb-3 shadow-lg">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Persatuan_Guru_Republik_Indonesia.png/500px-Persatuan_Guru_Republik_Indonesia.png" alt="Logo" className="w-12 h-12 object-contain"/>
          </div>
          <h2 className="text-xl font-bold tracking-wide text-white leading-tight">PGRI RANTING KALIJAGA</h2>
          <p className="text-[10px] text-red-200 mt-1 uppercase tracking-widest">Sistem Administrasi</p>
        </div>
        
        {/* MENU NAVIGASI */}
        <nav className="p-4 space-y-2 overflow-y-auto flex-1">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/info" icon={<Info size={20} />} label="Info dan Berita" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/members" icon={<Users size={20} />} label="Data Anggota" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/finance" icon={<Wallet size={20} />} label="Keuangan" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/donations" icon={<Heart size={20} />} label="Dana Sosial" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/letters" icon={<Mail size={20} />} label="Surat Menyurat" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/advocacy" icon={<Shield size={20} />} label="Advokasi Hukum" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/counseling" icon={<HeartHandshake size={20} />} label="Konseling" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/profile" icon={<Building2 size={20} />} label="Tentang Kami" onClick={() => setIsSidebarOpen(false)} />
        </nav>

        {/* FOOTER SIDEBAR (Hanya Copyright, Tombol Keluar DIHAPUS dari sini) */}
        <div className="p-4 bg-red-900 border-t border-red-800 text-center text-xs text-red-300/50">
          &copy; 2026 PGRI Kalijaga
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 md:ml-64 transition-all duration-300">
        <header className="bg-white p-4 shadow-sm border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu size={24} />
             </button>
             <h2 className="font-bold text-gray-700 text-sm md:text-lg">Selamat Datang, <span className="text-red-700 uppercase">Bapak & Ibu Guru Hebat!</span></h2>
          </div>

          {/* --- AREA PROFIL (INTERAKTIF) --- */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1 pr-2 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none border border-transparent hover:border-gray-100"
            >
              {/* Teks Nama & Role */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 flex items-center justify-end gap-1">
                  {userRole === 'super_admin' && <Crown size={14} className="text-yellow-500" />}
                  {userRole === 'admin' && <UserCog size={14} className="text-blue-500" />}
                  {userRole === 'user' && <User size={14} className="text-gray-500" />}
                  {getRoleLabel()}
                </p>
                <p className="text-xs text-gray-500 italic">PGRI Ranting Kalijaga</p>
              </div>

              {/* Lingkaran Foto Profil */}
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-2 text-white shadow-sm overflow-hidden relative
                ${userRole === 'super_admin' ? 'bg-yellow-500 border-yellow-200' : userRole === 'admin' ? 'bg-blue-600 border-blue-200' : 'bg-gray-500 border-gray-200'}
              `}>
                {profileImage ? (
                  <img src={profileImage} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <span>{userRole === 'super_admin' ? 'S' : userRole === 'admin' ? 'A' : 'U'}</span>
                )}
              </div>
              
              {/* Ikon Panah Kecil */}
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* --- DROPDOWN MENU --- */}
            {isProfileOpen && (
              <>
                {/* Layar Transparan (untuk menutup menu saat klik di luar) */}
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                
                {/* Kotak Menu */}
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                  {/* Info User di Mobile (karena di header hidden) */}
                  <div className="p-4 border-b border-gray-100 text-center bg-gray-50 sm:hidden">
                    <p className="font-bold text-gray-800">Pak Dendi</p>
                    <p className="text-xs text-gray-500">{getRoleLabel()}</p>
                  </div>
                  
                  <div className="p-2 space-y-1">
                    {/* Menu 1: Ubah Foto */}
                    <button 
                      onClick={triggerFileInput} 
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg flex items-center gap-3 transition-colors font-medium"
                    >
                      <Camera size={16} /> Ubah Foto Profil
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Menu 2: Keluar */}
                    <button 
                      onClick={onLogout} 
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 transition-colors font-bold"
                    >
                      <LogOut size={16} /> Keluar Aplikasi
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8">
          <Outlet context={{ userRole }} />
        </div>
      </main>
    </div>
  );
};

// Komponen Item Menu Navigasi
const NavItem = ({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string, onClick?: () => void }) => (
  <NavLink 
    to={to} 
    onClick={onClick}
    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${isActive ? 'bg-red-900 text-yellow-400 border-l-4 border-yellow-400 shadow-sm' : 'text-red-100 hover:bg-red-700 hover:text-white hover:translate-x-1'}`}
  >
    {icon}<span>{label}</span>
  </NavLink>
);

export default Layout;