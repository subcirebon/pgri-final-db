import React, { useState, useEffect, useRef } from 'react'; 
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wallet, Mail, Shield, Info, LogOut, Menu, X, 
  HeartHandshake, Building2, Crown, UserCog, User, Camera, ChevronDown, Loader2 
} from 'lucide-react';
import { supabase } from './supabaseClient'; 

// Props dari App.tsx
interface LayoutProps {
  onLogout: () => void;
  userRole: string;
  userName: string;
}

const Layout = ({ onLogout, userRole, userName }: LayoutProps) => {
  // --- STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // State Avatar URL
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const location = useLocation(); 

  // --- 1. LOAD FOTO OTOMATIS BERDASARKAN USER LOGIN ---
  useEffect(() => {
    const loadUserAvatar = async () => {
      // AMBIL ID DARI LOGIN (Bukan angka 1 manual lagi)
      const storedId = localStorage.getItem('pgri_user_id');
      
      if (storedId) {
        try {
          const { data, error } = await supabase
            .from('members')
            .select('avatar_url')
            .eq('id', storedId) // <-- KUNCI: Pakai ID yang login
            .single();

          if (data && !error) {
            setAvatarUrl(data.avatar_url);
          }
        } catch (err) {
          console.error("Gagal load avatar:", err);
        }
      }
    };

    loadUserAvatar();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- 2. FUNGSI UPLOAD FOTO ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const storedId = localStorage.getItem('pgri_user_id');
    if (!storedId) return alert("Error: ID User tidak ditemukan. Coba login ulang.");

    try {
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${storedId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Ambil Link Public
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Simpan ke Database user yang bersangkutan
      const { error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', storedId);

      if (updateError) throw updateError;

      setAvatarUrl(urlData.publicUrl);
      alert('Foto profil berhasil diperbarui!');
      setIsProfileOpen(false);

    } catch (error: any) {
      alert('Gagal upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  // Badge Jabatan
  const getRoleBadge = () => {
    if (userRole === 'super_admin') return <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold border border-yellow-200"><Crown size={10}/> Super Admin</span>;
    if (userRole === 'admin') return <span className="flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold border border-blue-200"><UserCog size={10}/> Admin</span>;
    return <span className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold border border-gray-200"><User size={10}/> Anggota</span>;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans relative">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={toggleSidebar}/>}

      {/* SIDEBAR */}
      <aside className={`w-64 bg-red-800 text-white fixed h-full shadow-xl z-30 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b border-red-700 flex flex-col items-center text-center">
          <button onClick={toggleSidebar} className="md:hidden absolute right-4 top-4 text-red-200"><X size={24} /></button>
          <div className="bg-white p-2 rounded-full mb-3 shadow-lg"><img src="/logo-pgri.png" alt="Logo" className="w-12 h-12 object-contain"/></div>
          <h2 className="text-xl font-bold tracking-wide">PGRI RANTING KALIJAGA</h2>
          <p className="text-[10px] text-red-200 mt-1 uppercase tracking-widest">Sistem Administrasi</p>
        </div>
        
        <nav className="p-4 space-y-2 overflow-y-auto flex-1 scrollbar-hide">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/news" icon={<Info size={20} />} label="Info dan Berita" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/members" icon={<Users size={20} />} label="Data Anggota" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/finance" icon={<Wallet size={20} />} label="Keuangan" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/donations" icon={<HeartHandshake size={20} />} label="Dana Sosial" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/letters" icon={<Mail size={20} />} label="Surat Menyurat" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/advocacy" icon={<Shield size={20} />} label="Advokasi Hukum" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/counseling" icon={<HeartHandshake size={20} />} label="Konseling" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/about" icon={<Building2 size={20} />} label="Tentang Kami" onClick={() => setIsSidebarOpen(false)} />
        </nav>

        <div className="p-4 bg-red-900 border-t border-red-800 text-center text-xs text-red-300/50">
          &copy; 2026 PGRI Ranting Kalijaga
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 md:ml-64 transition-all duration-300 flex flex-col min-h-screen">
        <header className="bg-white p-4 shadow-sm border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-600"><Menu size={24} /></button>
             <h2 className="font-bold text-gray-700 text-sm md:text-lg">Selamat Datang, <span className="text-red-700 uppercase">{userName}</span>!</h2>
          </div>

          <div className="relative">
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 p-1 pr-2 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-2 mb-0.5"><p className="text-sm font-bold text-gray-800">{userName}</p></div>
                <div className="flex justify-end">{getRoleBadge()}</div>
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold bg-gray-500 border-2 border-gray-200 text-white shadow-sm overflow-hidden relative">
                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <span>{userName.charAt(0)}</span>}
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="p-4 border-b border-gray-100 text-center bg-gray-50 sm:hidden">
                    <p className="font-bold text-gray-800">{userName}</p>
                    <div className="flex justify-center mt-1">{getRoleBadge()}</div>
                  </div>
                  <div className="p-2 space-y-1">
                    {/* HANYA ADA TOMBOL UPLOAD ASLI & LOGOUT (Tidak Ada Mode Developer) */}
                    <button onClick={triggerFileInput} disabled={uploading} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg flex items-center gap-3 font-medium">
                      {uploading ? <Loader2 size={16} className="animate-spin text-blue-600"/> : <Camera size={16} />} 
                      {uploading ? 'Sedang Mengupload...' : 'Ubah Foto Profil'}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 font-bold">
                      <LogOut size={16} /> Keluar Aplikasi
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          <Outlet context={{ userRole }} />
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ to, icon, label, onClick }: any) => (
  <NavLink to={to} onClick={onClick} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive ? 'bg-red-900 text-yellow-400 border-l-4 border-yellow-400' : 'text-red-100 hover:bg-red-700 hover:text-white'}`}>
    {icon}<span>{label}</span>
  </NavLink>
);

export default Layout;