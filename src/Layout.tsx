import React, { useState, useEffect, useRef } from 'react'; 
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wallet, Mail, Shield, Info, LogOut, Menu, X, 
  HeartHandshake, Building2, Crown, User, Camera, ChevronDown, Loader2, RefreshCw
} from 'lucide-react';
import { supabase } from './supabaseClient'; 

const Layout = ({ onLogout }: { onLogout: () => void }) => {
  // --- STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // STATE DINAMIS: Mengambil ID dari penyimpanan browser, default ke 1
  const [activeId, setActiveId] = useState<number>(() => {
    const saved = localStorage.getItem('pgri_active_id');
    return saved ? parseInt(saved) : 1;
  });

  const [userData, setUserData] = useState({
    name: 'Memuat...',
    jabatan: 'Anggota PGRI',
    avatar_url: '' as string | null
  });
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. LOAD DATA BERDASARKAN ACTIVE ID ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setUserData(prev => ({ ...prev, name: 'Memuat...' })); // Efek loading
        
        const { data, error } = await supabase
          .from('members')
          .select('name, teacher_type, avatar_url')
          .eq('id', activeId) // <--- PENTING: ID sekarang dinamis!
          .single();

        if (data) {
          setUserData({
            name: data.name || `User ID ${activeId}`,
            jabatan: data.teacher_type || 'Anggota PGRI',
            avatar_url: data.avatar_url || null
          });
        } else {
          // Jika ID tidak ditemukan di database
          setUserData({
            name: 'User Tidak Ditemukan',
            jabatan: '-',
            avatar_url: null
          });
        }
      } catch (error) {
        console.error("Error fetch profile:", error);
      }
    };

    fetchUserProfile();
  }, [activeId]); // Dijalankan ulang setiap kali activeId berubah

  // --- 2. FUNGSI GANTI ID (FITUR DEV) ---
  const switchUser = (newId: string) => {
    const id = parseInt(newId);
    if (!isNaN(id) && id > 0) {
      localStorage.setItem('pgri_active_id', id.toString());
      setActiveId(id);
      setIsProfileOpen(false);
      // alert(`Berhasil pindah ke User ID: ${id}`);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- 3. FUNGSI UPLOAD FOTO (SESUAI ID AKTIF) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Nama file unik per user
      const fileName = `${activeId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // A. Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // B. Ambil URL Publik
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;

      // C. Simpan ke Database (Sesuai ID Aktif)
      const { error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: publicUrl })
        .eq('id', activeId);

      if (updateError) throw updateError;

      // D. Update Tampilan
      setUserData(prev => ({ ...prev, avatar_url: publicUrl }));
      alert(`Foto untuk User ID ${activeId} berhasil diperbarui!`);
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
          <NavItem to="/donations" icon={<HeartHandshake size={20} />} label="Dana Sosial" onClick={() => setIsSidebarOpen(false)} />
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
                  <Crown size={14} className="text-yellow-500" />
                  {userData.name}
                </p>
                <p className="text-xs text-gray-500 italic">{userData.jabatan}</p>
              </div>

              <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold bg-gray-500 border-2 border-gray-200 text-white shadow-sm overflow-hidden relative">
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
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="p-4 border-b border-gray-100 text-center bg-gray-50 sm:hidden">
                    <p className="font-bold text-gray-800">{userData.name}</p>
                    <p className="text-xs text-gray-500">{userData.jabatan}</p>
                  </div>
                  
                  <div className="p-2 space-y-1">
                    {/* FITUR DEV: GANTI USER ID */}
                    <div className="px-4 py-2 bg-yellow-50 border border-yellow-100 rounded-lg mb-2">
                      <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-1">Mode Developer</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">ID:</span>
                        <input 
                          type="number" 
                          defaultValue={activeId}
                          className="w-12 text-xs border border-gray-300 rounded px-1 py-0.5"
                          onBlur={(e) => switchUser(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') switchUser((e.target as HTMLInputElement).value);
                          }}
                        />
                        <button onClick={() => window.location.reload()} className="p-1 hover:bg-yellow-200 rounded text-yellow-700" title="Refresh">
                          <RefreshCw size={12}/>
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">Ganti angka & Enter untuk pindah akun.</p>
                    </div>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button 
                      onClick={triggerFileInput} 
                      disabled={uploading}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg flex items-center gap-3 transition-colors font-medium"
                    >
                      {uploading ? <Loader2 size={16} className="animate-spin text-blue-600"/> : <Camera size={16} />} 
                      {uploading ? 'Sedang Mengupload...' : 'Ubah Foto Profil'}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    
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
          {/* Kirim role "admin" sebagai default untuk testing */}
          <Outlet context={{ userRole: 'admin' }} />
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