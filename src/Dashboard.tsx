import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wallet, Mail, 
  Megaphone, ShieldAlert, HeartHandshake, 
  LogOut, UserCircle 
} from 'lucide-react';

// Terima props userName dan userRole dari App.tsx
interface LayoutProps {
  onLogout: () => void;
  userRole: string;
  userName: string;
}

const Layout = ({ onLogout, userRole, userName }: LayoutProps) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/members', label: 'Anggota', icon: <Users size={20} /> },
    { path: '/finance', label: 'Keuangan', icon: <Wallet size={20} /> },
    { path: '/letters', label: 'Surat', icon: <Mail size={20} /> },
    { path: '/info', label: 'Info & Berita', icon: <Megaphone size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-red-800 p-2 rounded-xl">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Persatuan_Guru_Republik_Indonesia.png/500px-Persatuan_Guru_Republik_Indonesia.png" className="w-6 h-6 object-contain" alt="Logo" />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-800 uppercase leading-tight">PGRI Kalijaga</h1>
              <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest">Administrasi</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                location.pathname === item.path
                  ? 'bg-red-50 text-red-800 shadow-sm'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            Keluar Aplikasi
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">
        {/* OPER DATA KE DASHBOARD LEWAT OUTLET CONTEXT */}
        <Outlet context={{ userRole, userName }} />
      </main>
    </div>
  );
};

export default Layout;