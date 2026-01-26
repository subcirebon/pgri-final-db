import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Newspaper, Calendar, User, Tag, Plus, Search, ChevronRight, X, Save, Upload } from 'lucide-react';

interface NewsItem { id: number; title: string; date: string; author: string; category: string; content: string; fullContent: string; image: string; }

const Info = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  // HAK AKSES: Hanya Admin/Super yang bisa CREATE
  const canCreate = userRole === 'super_admin' || userRole === 'admin';

  // DATA DUMMY DEFAULT (Agar User selalu melihat berita saat login)
  const [newsList, setNewsList] = useState<NewsItem[]>([
    {
      id: 1, title: "Pendaftaran PPG Daljab 2026", date: "2026-01-24", author: "Admin Cabang", category: "Kedinasan",
      content: "Kemendikbudristek resmi membuka pendaftaran PPG Daljab. Segera cek SIMPKB.",
      fullContent: "Kemendikbudristek resmi membuka pendaftaran PPG Daljab Angkatan I. Cek SIMPKB masing-masing.",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: 2, title: "Rapat Kerja Ranting PGRI", date: "2026-01-20", author: "Sekretaris", category: "Kegiatan PGRI",
      content: "Pengurus ranting menyusun program kerja tahun 2026.",
      fullContent: "Bertempat di SDN Kalijaga Permai, rapat kerja menghasilkan 5 program unggulan.",
      image: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=400"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({ title: '', date: '', category: 'Pengumuman', fullContent: '', image: '' });

  const filteredNews = newsList.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'Semua' || item.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: NewsItem = {
      id: Date.now(), title: formData.title, date: formData.date, author: "Admin", category: formData.category as any,
      content: formData.fullContent.substring(0, 100) + "...", fullContent: formData.fullContent,
      image: formData.image || "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=400"
    };
    setNewsList([newItem, ...newsList]);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Newspaper className="text-red-700"/> Info & Berita</h1></div>
        
        {/* TOMBOL BUAT BERITA: HANYA MUNCUL UNTUK ADMIN/SUPER */}
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-800 shadow-md">
            <Plus size={18} /> Buat Berita Baru
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {['Semua', 'Kedinasan', 'Kegiatan PGRI', 'Lomba & Prestasi', 'Pengumuman'].map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCategory === cat ? 'bg-red-700 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
          ))}
        </div>
        <div className="relative w-full md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Cari berita..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      </div>

      {/* BERITA LIST (VISIBLE TO ALL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col h-full">
            <div className="h-48 overflow-hidden relative">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1"><Tag size={12} className="text-red-600" /> {item.category}</div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3"><span className="flex items-center gap-1"><Calendar size={12}/> {item.date}</span><span className="flex items-center gap-1"><User size={12}/> {item.author}</span></div>
              <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight line-clamp-2">{item.title}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-1">{item.content}</p>
              <button onClick={() => setSelectedNews(item)} className="w-full mt-auto bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 py-2 rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-1">Baca Selengkapnya <ChevronRight size={16} /></button>
            </div>
          </div>
        ))}
      </div>
      
      {/* MODAL BACA (VISIBLE TO ALL) */}
      {selectedNews && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div className="relative h-64 bg-gray-200"><img src={selectedNews.image} className="w-full h-full object-cover"/><button onClick={()=>setSelectedNews(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full">X</button></div><div className="p-8 prose max-w-none">{selectedNews.fullContent}</div></div></div>}

      {/* MODAL BUAT (ADMIN ONLY) */}
      {canCreate && showModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded-lg w-full max-w-lg"><h3>Tulis Berita</h3><input className="border w-full p-2 mb-2" placeholder="Judul" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})}/><input type="file" onChange={handleImageUpload} className="mb-2"/><textarea className="border w-full p-2 mb-2" rows={5} placeholder="Isi Berita" value={formData.fullContent} onChange={e=>setFormData({...formData, fullContent: e.target.value})}/><button onClick={handleSubmit} className="bg-red-700 text-white px-4 py-2 rounded">Terbitkan</button><button onClick={()=>setShowModal(false)} className="ml-2 text-gray-500">Batal</button></div></div>}
    </div>
  );
};

export default Info;