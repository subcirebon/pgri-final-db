import React, { useState, useEffect, useRef } from 'react'; 
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wallet, Mail, Shield, Info, LogOut, Menu, X, 
  HeartHandshake, Building2, Crown, UserCog, User, Heart, Camera, ChevronDown, Loader2 
} from 'lucide-react';
import { supabase } from './supabaseClient'; 

const Layout = ({ onLogout, userRole }: { onLogout: () => void, userRole: string }) => {
  // --- STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // State Data User
  const [userData, setUserData] = useState({
    name: 'Memuat...',
    role: 'Anggota PGRI', // Default text
    avatar_url: '' as string | null
  });
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ID User Hardcode (User ID = 1)
  const MEMBER_ID = 1; 

  // --- 1. LOAD DATA DARI SUPABASE (Perbaikan Query) ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // PERBAIKAN DI SINI:
        // Kita meminta 'name', 'teacher_type', dan 'avatar_url' (sesuai kolom databasemu)
        // Kita TIDAK meminta 'role' karena kolom itu tidak ada.
        const { data, error } = await supabase
          .from('members')
          .select('name, teacher_type, avatar_url')
          .eq('id', MEMBER_ID)
          .single();

        if (error) {
          console.error("Error ambil data:", error.message);
          return;
        }

        if (data) {
          setUserData({
            name: data.name || 'Tanpa Nama',
            // Kita pakai teacher_type sebagai jabatan, atau default text
            role: data.teacher_type || 'PGRI Ranting Kalijaga',
            avatar_url: data.avatar_url || null
          });
        }
      } catch (error) {
        console.error("Error fetch profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- 2. FUNGSI UPLOAD KE SUPABASE STORAGE ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Gunakan timestamp agar nama file unik
      const fileName = `${MEMBER_ID}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // A. Upload File
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // B. Ambil URL Publik
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;

      // C. Simpan Link ke Database
      const { error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: publicUrl })
        .eq('id', MEMBER_ID);

      if (updateError) throw updateError;

      // D. Update Tampilan Langsung
      setUserData(prev => ({ ...prev, avatar_url: publicUrl }));
      alert('Foto profil berhasil diperbarui!');
      setIsProfileOpen(false);

    } catch (error: any) {
      alert('Gagal upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getRoleLabel = () => {
    if (userRole === 'super_admin') return 'Super Admin';
    if (userRole === 'admin') return 'Administrator';
    return 'Anggota';
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
            <img src="/logo-pgri.png" alt="Logo" className="w-12 h-12 object-contain"/>
          </div>
          <h2 className="text-xl font-bold tracking-wide text-white leading-tight">PGRI RANTING KALIJAGA</h2>
          <p className="text-[10px] text-red-200 mt-1 uppercase tracking-widest">Sistem Administrasi</p>
        </div>
        
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

        <div className="p-4 bg-red-900 border-t border-red-800 text-center text-xs text-red-300/50">
          &copy; 2026 PGRI Ranting Kalijaga
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

          {/* --- AREA PROFIL --- */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1 pr-2 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none border border-transparent hover:border-gray-100"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 flex items-center justify-end gap-1">
                  {userRole === 'super_admin' && <Crown size={14} className="text-yellow-500" />}
                  {userRole === 'admin' && <UserCog size={14} className="text-blue-500" />}
                  {userData.name} {/* Nama dari Database */}
                </p>
                <p className="text-xs text-gray-500 italic">{userData.role}</p>
              </div>

              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-2 text-white shadow-sm overflow-hidden relative
                ${userRole === 'super_admin' ? 'bg-yellow-500 border-yellow-200' : 'bg-gray-500 border-gray-200'}
              `}>
                {userData.avatar_url ? (
                  <img src={userData.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <span>{userData.name.charAt(0)}</span>
                )}
              </div>
              
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* --- DROPDOWN --- */}
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="p-4 border-b border-gray-100 text-center bg-gray-50 sm:hidden">
                    <p className="font-bold text-gray-800">{userData.name}</p>
                    <p className="text-xs text-gray-500">{userData.role}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={triggerFileInput} 
                      disabled={uploading}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg flex items-center gap-3 transition-colors font-medium"
                    >
                      {uploading ? <Loader2 size={16} className="animate-spin text-blue-600"/> : <Camera size={16} />} 
                      {uploading ? 'Sedang Mengupload...' : 'Ubah Foto Profil'}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <div className="border-t border-gray-100 my-1"></div>
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