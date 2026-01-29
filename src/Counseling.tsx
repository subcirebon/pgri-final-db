import React, { useState } from 'react';
import { HeartHandshake, MessageCircle, Calendar, Smile, Video, X, Clock, FileText } from 'lucide-react';

const Counseling = () => {
  // Data Motivasi
  const quote = {
    text: "Mengajar adalah pekerjaan hati. Jangan lupa istirahat jika lelah, karena pelita yang habis minyaknya tak bisa menerangi sekitarnya.",
    author: "Refleksi Guru"
  };

  // Data Konselor (Bisa ditambah nanti)
  const counselors = [
    { id: 1, name: 'Ibu Dra. Rina (Psikolog)', phone: '628123456789', specialized: 'Masalah Pribadi & Keluarga' },
    { id: 2, name: 'Pak H. Dedi (Senior)', phone: '628987654321', specialized: 'Masalah Karir & Siswa' }
  ];

  // Riwayat Konseling (Dummy)
  const [history] = useState([
    { id: 1, date: '2026-01-10', topic: 'Kesulitan Menghadapi Wali Murid', counselor: 'Pak H. Dedi', status: 'Selesai' },
    { id: 2, date: '2025-12-20', topic: 'Burnout / Kelelahan Mengajar', counselor: 'Ibu Dra. Rina', status: 'Selesai' }
  ]);

  // --- STATE MODAL FORMULIR ---
  const [showModal, setShowModal] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<any>(null);
  const [formData, setFormData] = useState({
    topic: '',
    date: '',
    time: ''
  });

  // 1. FUNGSI CHAT WA (Langsung ke Konselor)
  const handleChat = (counselor: any) => {
    const message = `Assalamu’alaikum ${counselor.name},%0A%0ASaya anggota PGRI ingin mengajukan sesi konseling/curhat via Chat mengenai: %0A...%0A%0AMohon waktunya. Terima kasih.`;
    window.open(`https://wa.me/${counselor.phone}?text=${message}`, '_blank');
  };

  // 2. FUNGSI BUKA MODAL TATAP MAYA
  const openVideoForm = (counselor: any) => {
    setSelectedCounselor(counselor);
    setShowModal(true);
  };

  // 3. FUNGSI KIRIM PENGAJUAN (Ke Admin Jadwal)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Nomor WA Admin yang mengatur jadwal Zoom (Bisa diganti nomor Admin asli)
    const adminPhone = '6285338833543'; 

    const message = `Halo Admin PGRI,%0A%0ASaya ingin mengajukan sesi *Tatap Maya (Online)*.%0A%0A📋 *DATA PENGAJUAN*%0AKonselor: ${selectedCounselor.name}%0ATopik: ${formData.topic}%0ATanggal: ${formData.date}%0AJam: ${formData.time}%0A%0AMohon dibuatkan link Zoom/Meet sesuai jadwal tersebut. Terima kasih.`;
    
    window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
    
    setShowModal(false);
    setFormData({ topic: '', date: '', time: '' });
  };

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <HeartHandshake className="text-teal-600" /> Ruang Konseling
          </h1>
          <p className="text-gray-500">Tempat aman untuk berbagi cerita dan beban rasa</p>
        </div>
      </div>

      {/* BANNER MOTIVASI */}
      <div className="bg-teal-50 border border-teal-100 p-6 rounded-2xl flex gap-4 items-start shadow-sm">
        <div className="bg-white p-3 rounded-full text-teal-600 shadow-sm"><Smile size={32} /></div>
        <div>
          <h3 className="font-bold text-teal-800 text-lg mb-1">Motivasi Hari Ini</h3>
          <p className="text-teal-700 italic text-lg leading-relaxed">"{quote.text}"</p>
          <p className="text-teal-600 text-sm mt-2 font-medium">- {quote.author}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LIST KONSELOR */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-lg">Hubungi Sahabat Konseling</h3>
          <div className="space-y-3">
            {counselors.map((c) => (
              <div key={c.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-teal-400 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-800">{c.name}</h4>
                    <p className="text-sm text-gray-500">{c.specialized}</p>
                  </div>
                  <div className="bg-teal-100 text-teal-700 p-2 rounded-lg"><HeartHandshake size={20} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleChat(c)} className="bg-teal-50 hover:bg-teal-100 text-teal-700 py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors border border-teal-200 text-sm">
                    <MessageCircle size={16} /> Chat WA
                  </button>
                  <button onClick={() => openVideoForm(c)} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm shadow-sm">
                    <Video size={16} /> Tatap Maya
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIWAYAT SESI */}
        <div>
          <h3 className="font-bold text-gray-800 text-lg mb-4">Riwayat Sesi Saya</h3>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
             {history.length > 0 ? (
               <div className="divide-y divide-gray-100">
                 {history.map((h) => (
                   <div key={h.id} className="p-4 hover:bg-gray-50">
                     <div className="flex justify-between items-start mb-1">
                       <h5 className="font-bold text-gray-700">{h.topic}</h5>
                       <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-bold">{h.status}</span>
                     </div>
                     <p className="text-sm text-gray-500 flex items-center gap-2"><Calendar size={14} /> {h.date} &bull; Bersama {h.counselor}</p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="p-8 text-center text-gray-400">Belum ada riwayat konseling.</div>
             )}
          </div>
        </div>
      </div>

      {/* --- MODAL FORMULIR PENGAJUAN (POPUP) --- */}
      {showModal && selectedCounselor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            
            {/* Header Modal */}
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Video size={20}/> Ajukan Tatap Maya</h3>
                <p className="text-indigo-100 text-sm">Konselor: {selectedCounselor.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"><X size={20} /></button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
              
              {/* Topik */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600"/> Topik yang ingin dibahas
                </label>
                <textarea 
                  required
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="Ceritakan sedikit gambaran masalahnya..."
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tanggal */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-600"/> Tanggal
                  </label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                {/* Jam */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-600"/> Jam (WIB)
                  </label>
                  <input 
                    type="time" 
                    required
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                >
                  <Video size={18} />
                  Kirim Pengajuan ke Admin
                </button>
                <p className="text-xs text-center text-gray-400 mt-3 bg-gray-50 py-2 rounded-lg">
                  *Admin akan menghubungi Anda untuk konfirmasi & link Zoom.
                </p>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Counseling;