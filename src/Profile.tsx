import React from 'react';
import { Target, Users, MapPin, Phone, Mail, Award } from 'lucide-react';

const Profile = () => {
  // --- BAGIAN INI YANG HARUS BAPAK GANTI ---
  // Tempel link Imgur Bapak di dalam tanda kutip '...'
  
  const ketua = { 
    nama: 'Dendi Suparman, S.Pd.SD', 
    jabatan: 'Ketua Ranting', 
    // GANTI LINK DI BAWAH INI:
    foto: 'https://i.imgur.com/s8YYc8H.jpeg' 
  };
  
  const wakil = { 
    nama: 'Jatu Wahyu Wicaksono, M.Pd.', 
    jabatan: 'Wakil Ketua', 
    // GANTI LINK DI BAWAH INI:
    foto: 'https://i.imgur.com/vSXYtwL.jpeg' 
  };
  
  const staff = [
    { 
      nama: 'Abdy Eka Prasetia, S.Pd', 
      jabatan: 'Sekretaris', 
      // GANTI LINK DI BAWAH INI:
      foto: 'https://i.imgur.com/GOyjrb3.jpeg' 
    },
    { 
      nama: 'Pramuji, S.Pd', 
      jabatan: 'Wakil Sekretaris', 
      // GANTI LINK DI BAWAH INI:
      foto: 'https://i.imgur.com/wQ48kws.jpeg' 
    },
    { 
      nama: 'Eko Pranoto, S.Pd', 
      jabatan: 'Bendahara', 
      // GANTI LINK DI BAWAH INI:
      foto: 'https://i.imgur.com/sQmIpIb.jpeg' 
    },
  ];

  return (
    <div className="space-y-8">
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
            <ul className="space-y-2 text-gray-600 list-disc pl-5">
              <li>Mewujudkan guru yang profesional, sejahtera, dan terlindungi.</li>
              <li>Meningkatkan mutu pendidikan dan karakter bangsa.</li>
              <li>Membangun solidaritas dan kesetiakawanan anggota.</li>
              <li>Menjalin kemitraan strategis dengan pemerintah dan masyarakat.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. STRUKTUR KEPENGURUSAN */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-slate-800 p-4 text-white flex items-center gap-2">
          <Users size={24} className="text-blue-400" />
          <h2 className="font-bold text-lg">Struktur Kepengurusan</h2>
        </div>
        
        <div className="p-8 relative min-h-[700px]">
          
          {/* LEVEL 1: KETUA */}
          <div className="flex justify-center relative z-20">
            <div className="text-center w-64 bg-white p-3 rounded-2xl border-2 border-red-100 shadow-xl">
              <img 
                src={ketua.foto} 
                alt={ketua.nama}
                // Tambahkan fallback jika gambar rusak/belum diisi
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=FOTO';
                }}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-2 border-4 border-red-600 shadow-sm bg-gray-200"
              />
              <h4 className="font-bold text-gray-800 text-lg leading-tight">{ketua.nama}</h4>
              <span className="bg-red-700 text-white px-3 py-1 rounded-full text-xs font-bold uppercase mt-1 inline-block">
                {ketua.jabatan}
              </span>
            </div>
          </div>

          {/* GARIS UTAMA */}
          <div className="absolute left-1/2 top-40 bottom-32 w-1 bg-gray-300 -translate-x-1/2 -z-0"></div>

          {/* LEVEL 2: WAKIL KETUA */}
          <div className="relative mt-8 mb-20 h-48"> 
             <div className="absolute left-1/2 top-10 w-32 h-1 bg-gray-300"></div>
             <div className="absolute left-[calc(50%+128px)] top-10 h-10 bg-gray-300 w-1"></div>
             <div className="absolute left-[calc(50%+60px)] top-20 w-56 text-center bg-white p-3 rounded-xl border border-gray-200 shadow-lg z-10">
                <img 
                  src={wakil.foto} 
                  alt={wakil.nama}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=FOTO';
                  }}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-2 border-4 border-blue-600 shadow-sm bg-gray-200"
                />
                <h4 className="font-bold text-gray-800 text-sm leading-tight">{wakil.nama}</h4>
                <span className="bg-blue-700 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 inline-block">
                  {wakil.jabatan}
                </span>
             </div>
          </div>

          {/* LEVEL 3: STAFF */}
          <div className="mt-12 relative z-10">
             <div className="absolute -top-8 left-[15%] right-[15%] h-8 border-t-2 border-x-2 border-gray-300 rounded-t-xl"></div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {staff.map((p, idx) => (
                 <div key={idx} className="flex flex-col items-center relative bg-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                   <div className="absolute -top-8 w-0.5 h-8 bg-gray-300"></div>
                   <img 
                      src={p.foto} 
                      alt={p.nama}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=FOTO';
                      }}
                      className={`w-20 h-20 rounded-full object-cover mb-2 border-4 shadow-sm bg-gray-200
                        ${p.jabatan === 'Bendahara' ? 'border-yellow-500' : p.jabatan === 'Wakil Sekretaris' ? 'border-teal-500' : 'border-green-600'}
                      `}
                    />
                   <h4 className="font-bold text-gray-800 text-sm text-center leading-tight">{p.nama}</h4>
                   <span className={`text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 inline-block
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
          <h3 className="font-bold text-xl mb-6">Hubungi Kami</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="shrink-0 text-blue-300" />
              <div>
                <p className="font-bold text-sm opacity-80">Alamat Sekretariat:</p>
                <p className="text-sm leading-relaxed">JL. Teratai Raya I, RT.08/RW.11, Kalijaga, Kec. Harjamukti, Kota Cirebon, Jawa Barat 45144</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="shrink-0 text-blue-300" />
              <div>
                <p className="font-bold text-sm opacity-80">Email:</p>
                <p className="text-sm">ranting.kalijaga@pgri.or.id</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="shrink-0 text-blue-300" />
              <div>
                <p className="font-bold text-sm opacity-80">WhatsApp Admin:</p>
                <p className="text-sm">+62 853-3883-3543</p>
              </div>
            </div>
          </div>
        </div>

        {/* PETA LOKASI */}
        <div className="md:col-span-2 bg-gray-200 rounded-2xl h-64 overflow-hidden relative group">
          <img 
            src="https://plus.unsplash.com/premium_photo-1681487798758-04787a334670?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
            alt="Ilustrasi Peta" 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <a 
               href="https://maps.app.goo.gl/k66T18HoxrVbkTks5" 
               target="_blank" 
               rel="noreferrer"
               className="bg-white/90 text-gray-800 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-white hover:scale-105 transition-all flex items-center gap-2 text-sm cursor-pointer"
             >
               <MapPin size={16} className="text-red-600"/> 
               Lokasi Sekretariat Silahkan Buka di Google Maps
             </a>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;