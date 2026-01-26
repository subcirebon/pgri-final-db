import React, { useState } from 'react';
import { HeartHandshake, MessageCircle, Calendar, Smile, Video, X, Clock, FileText } from 'lucide-react';

const Counseling = () => {
  // Data Motivasi
  const quote = {
    text: "Mengajar adalah pekerjaan hati. Jangan lupa istirahat jika lelah, karena pelita yang habis minyaknya tak bisa menerangi sekitarnya.",
    author: "Refleksi Guru"
  };

  // Data Konselor
  const counselors = [
    { id: 1, name: 'Ibu Dra. Rina (Psikolog)', phone: '628123456789', specialized: 'Masalah Pribadi & Keluarga' },
    { id: 2, name: 'Pak H. Dedi (Senior)', phone: '628987654321', specialized: 'Masalah Karir & Siswa' }
  ];

  // Riwayat (Dummy)
  const [history] = useState([
    { id: 1, date: '2026-01-10', topic: 'Kesulitan Menghadapi Wali Murid', counselor: 'Pak H. Dedi', status: 'Selesai' },
    { id: 2, date: '2025-12-20', topic: 'Burnout / Kelelahan Mengajar', counselor: 'Ibu Dra. Rina', status: 'Selesai' }
  ]);

  // STATE UNTUK FORM MODAL
  const [showModal, setShowModal] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<any>(null);
  const [formData, setFormData] = useState({
    topic: '',
    date: '',
    time: ''
  });

  // 1. FUNGSI CHAT WA (Langsung)
  const handleChat = (counselor: any) => {
    const message = `Assalamu’alaikum ${counselor.name},%0A%0ASaya anggota PGRI ingin mengajukan sesi konseling/curhat via Chat mengenai: %0A...%0A%0AMohon waktunya. Terima kasih.`;
    window.open(`https://wa.me/${counselor.phone}?text=${message}`, '_blank');
  };

  // 2. FUNGSI BUKA FORM TATAP MAYA
  const openVideoForm = (counselor: any) => {
    setSelectedCounselor(counselor);
    setShowModal(true); // Buka Modal
  };

  // 3. FUNGSI KIRIM DATA FORM KE WA ADMIN
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman
    
    // Nomor WA Admin Jadwal
    const adminPhone = '6285338833543'; 

    const message = `Halo Admin PGRI,%0A%0ASaya ingin mengajukan sesi *Tatap Maya (Online)*.%0A%0A📋 *DATA PENGAJUAN*%0AKonselor: ${selectedCounselor.name}%0ATopik: ${formData.topic}%0ATanggal: ${formData.date}%0AJam: ${formData.time}%0A%0AMohon dibuatkan link Zoom/Meet sesuai jadwal tersebut. Terima kasih.`;
    
    window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
    
    // Reset & Tutup
    setShowModal(false);
    setFormData({ topic: '', date: '', time: '' });
  };

  return (
    <div className="space-y-6 relative">
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

        {/* RIWAYAT */}
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

      {/* --- MODAL FORMULIR PENGAJUAN --- */}
      {showModal && selectedCounselor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Formulir Tatap Maya</h3>
                <p className="text-sm text-gray-500">Konselor: <span className="font-semibold text-indigo-600">{selectedCounselor.name}</span></p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full"><X size={20} /></button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              {/* Input Topik */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                  <FileText size={16} /> Topik Permasalahan
                </label>
                <textarea 
                  required
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Contoh: Saya merasa kesulitan membagi waktu antara sekolah dan kuliah..."
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Input Tanggal */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <Calendar size={16} /> Tanggal
                  </label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                {/* Input Jam */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <Clock size={16} /> Jam (WIB)
                  </label>
                  <input 
                    type="time" 
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-indigo-200"
                >
                  <Video size={20} />
                  Kirim Pengajuan ke Admin
                </button>
                <p className="text-xs text-center text-gray-400 mt-3">
                  *Admin akan mengirimkan Link Zoom setelah jadwal dikonfirmasi.
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