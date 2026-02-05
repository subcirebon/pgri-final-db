import React from 'react';
import { Target, Users, MapPin, Phone, Mail, Award } from 'lucide-react';

const Profile = () => {
  // --- DATA PENGURUS DENGAN FOTO IMGUR ---
  
  const ketua = { 
    nama: 'Dendi Suparman, S.Pd.SD', 
    jabatan: 'Ketua Ranting', 
    foto: 'https://i.imgur.com/s8YYc8H.jpeg' 
  };
  
  const wakil = { 
    nama: 'Jatu Wahyu Wicaksono, M.Pd.', 
    jabatan: 'Wakil Ketua', 
    foto: 'https://i.imgur.com/vSXYtwL.jpeg' 
  };
  
  const staff = [
    { 
      nama: 'Abdy Eka Prasetia, S.Pd', 
      jabatan: 'Sekretaris', 
      foto: 'https://i.imgur.com/GOyjrb3.jpeg' 
    },
    { 
      nama: 'Pramuji, S.Pd', 
      jabatan: 'Wakil Sekretaris', 
      foto: 'https://i.imgur.com/wQ48kws.jpeg' 
    },
    { 
      nama: 'Eko Pranoto, S.Pd', 
      jabatan: 'Bendahara', 
      foto: 'https://i.imgur.com/sQmIpIb.jpeg' 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Award className="text-red-700" /> Profil Organisasi
        </h1>
        <p className="text-gray-500">Mengenal lebih dekat PGRI Ranting Kalijaga</p>
      </div>

      {/* 1. VISI & MISI */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-red-800 p-4 text-white flex items-center gap-2">
          <Target size={24} className="text-yellow-400" />
          <h2 className="font-bold text-lg">Visi & Misi</h2>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-gray-800 text-lg mb-3 border-b-2 border-red-100 pb-1 inline-block">Visi</h3>
            <p className="text-gray-600 leading-relaxed italic bg-gray-50 p-4 rounded-lg border-l-4 border-red-800">
              "Terwujudnya PGRI sebagai organisasi profesi terpercaya, dinamis, kuat, dan bermartabat dalam mencerdaskan kehidupan bangsa."
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg mb-3 border-b-2 border-red-100 pb-1 inline-block">Misi</h3>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 text-sm leading-relaxed">
              <li>Mewujudkan guru yang profesional, sejahtera, dan terlindungi.</li>
              <li>Meningkatkan mutu pendidikan dan karakter bangsa.</li>
              <li>Membangun solidaritas dan kesetiakawanan anggota.</li>
              <li>Menjalin kemitraan strategis dengan pemerintah dan masyarakat.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. STRUKTUR KEPENGURUSAN 

[Image of organizational chart structure]
 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-slate-800 p-4 text-white flex items-center gap-2">
          <Users size={24} className="text-blue-400" />
          <h2 className="font-bold text-lg">Struktur Kepengurusan</h2>
        </div>
        
        {/* Container Bagan */}
        <div className="p-8 relative min-h-[600px] flex flex-col items-center">
          
          {/* LEVEL 1: KETUA */}
          <div className="relative z-20 mb-8">
            <div className="flex flex-col items-center w-64 bg-white p-4 rounded-2xl border-2 border-red-100 shadow-xl transform hover:scale-105 transition-transform">
              <img 
                src={ketua.foto} 
                alt={ketua.nama}
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=FOTO'; }}
                className="w-24 h-24 rounded-full object-cover mb-3 border-4 border-red-600 shadow-sm bg-gray-100"
              />
              <h4 className="font-bold text-gray-800 text-lg text-center leading-tight">{ketua.nama}</h4>
              <span className="bg-red-700 text-white px-4 py-1 rounded-full text-xs font-bold uppercase mt-2 shadow-sm">
                {ketua.jabatan}
              </span>
            </div>
            {/* Garis Vertikal Bawah Ketua */}
            <div className="absolute left-1/2 -bottom-8 w-1 h-8 bg-gray-300 -translate-x-1/2"></div>
          </div>

          {/* LEVEL 2: WAKIL KETUA */}
          <div className="relative z-10 mb-12">
             <div className="flex flex-col items-center w-56 bg-white p-3 rounded-xl border border-gray-200 shadow-lg transform hover:scale-105 transition-transform">
                <img 
                  src={wakil.foto} 
                  alt={wakil.nama}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=FOTO'; }}
                  className="w-20 h-20 rounded-full object-cover mb-2 border-4 border-blue-600 shadow-sm bg-gray-100"
                />
                <h4 className="font-bold text-gray-800 text-sm text-center leading-tight">{wakil.nama}</h4>
                <span className="bg-blue-700 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1">
                  {wakil.jabatan}
                </span>
             </div>
             {/* Garis Vertikal Atas Wakil */}
             <div className="absolute left-1/2 -top-8 w-1 h-8 bg-gray-300 -translate-x-1/2"></div>
             {/* Garis Vertikal Bawah Wakil */}
             <div className="absolute left-1/2 -bottom-12 w-1 h-12 bg-gray-300 -translate-x-1/2"></div>
          </div>

          {/* LEVEL 3: STAFF (HORIZONTAL) */}
          <div className="relative w-full max-w-4xl">
             {/* Garis Horizontal Penghubung */}
             <div className="absolute -top-6 left-[16%] right-[16%] h-6 border-t-2 border-x-2 border-gray-300 rounded-t-xl"></div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {staff.map((p, idx) => (
                 <div key={idx} className="flex flex-col items-center relative bg-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1">
                   {/* Garis Konektor Kecil */}
                   <div className="absolute -top-6 w-0.5 h-6 bg-gray-300"></div>
                   
                   <img 
                      src={p.foto} 
                      alt={p.nama}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=FOTO'; }}
                      className={`w-20 h-20 rounded-full object-cover mb-2 border-4 shadow-sm bg-gray-100
                        ${p.jabatan === 'Bendahara' ? 'border-yellow-500' : p.jabatan === 'Wakil Sekretaris' ? 'border-teal-500' : 'border-green-600'}
                      `}
                    />
                   <h4 className="font-bold text-gray-800 text-sm text-center leading-tight min-h-[40px] flex items-center">{p.nama}</h4>
                   <span className={`text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase mt-1 inline-block shadow-sm
                     ${p.jabatan === 'Bendahara' ? 'bg-yellow-600' : p.jabatan === 'Wakil Sekretaris' ? 'bg-teal-600' : 'bg-green-700'}
                   `}>
                     {p.jabatan}
                   </span>
                 </div>
               ))}
             </div>
          </div>
          
        </div>
      </div>

      {/* 3. CONTACT US */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="font-bold text-xl mb-6 border-b border-white/20 pb-4">Hubungi Kami</h3>
          <div className="space-y-6">
            <div className="flex items-start gap-3 group">
              <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                <MapPin className="shrink-0 text-blue-100" size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-blue-100 mb-1">Alamat Sekretariat:</p>
                <p className="text-sm leading-relaxed">JL. Teratai Raya I, RT.08/RW.11, Kalijaga, Kec. Harjamukti, Kota Cirebon, Jawa Barat 45144</p>
              </div>
            </div>
            <div className="flex items-center gap-3 group">
               <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                <Mail className="shrink-0 text-blue-100" size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-blue-100 mb-1">Email:</p>
                <p className="text-sm">pgrikalijaga@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 group">
               <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                <Phone className="shrink-0 text-blue-100" size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-blue-100 mb-1">WhatsApp Admin:</p>
                <p className="text-sm font-mono">+62 853-3883-3543</p>
              </div>
            </div>
          </div>
        </div>

        {/* PETA LOKASI */}
        <div className="md:col-span-2 bg-gray-200 rounded-2xl h-full min-h-[250px] overflow-hidden relative group border-2 border-white shadow-sm">
          <img 
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" 
            alt="Ilustrasi Peta" 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
             <a 
               href="https://maps.app.goo.gl/3HBqusDgkLSegUuq9" 
               target="_blank" 
               rel="noreferrer"
               className="bg-white text-red-700 px-6 py-3 rounded-full font-bold shadow-xl hover:bg-red-50 hover:scale-105 transition-all flex items-center gap-2 text-sm cursor-pointer animate-bounce"
             >
               <MapPin size={18} className="text-red-600"/> 
               Buka Google Maps
             </a>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;