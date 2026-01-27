import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, Plus, Newspaper, Trash2, Edit, 
  Calendar, Tag, Loader2, Megaphone, Bookmark
} from 'lucide-react';

interface NewsItem {
  id: number;
  date: string;
  title: string;
  content: string;
  category: 'Berita' | 'Pengumuman' | 'Agenda';
  author: string;
}

const News = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    category: 'Berita' as 'Berita' | 'Pengumuman' | 'Agenda',
    author: 'Admin Ranting'
  });

  const fetchNews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false });

    if (error) console.error(error);
    else setNews(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let error;
    if (isEditing && editId !== null) {
      const res = await supabase.from('news').update(formData).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('news').insert([formData]);
      error = res.error;
    }

    if (!error) {
      alert(isEditing ? 'Berita diperbarui!' : 'Berita berhasil diterbitkan!');
      fetchNews();
      setShowModal(false);
    } else {
      alert('Gagal menyimpan: ' + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Hapus berita ini?')) {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (!error) fetchNews();
    }
  };

  const filteredNews = news.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Semua' || n.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase italic">Info & Berita Ranting</h1>
          <p className="text-xs text-red-700 font-bold">Informasi Terkini PGRI Kalijaga</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setIsEditing(false); setFormData({date: new Date().toISOString().split('T')[0], title: '', content: '', category: 'Berita', author: 'Admin Ranting'}); setShowModal(true); }} className="bg-red-800 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-red-900 transition-all">
            <Plus size={16} /> Terbitkan Berita
          </button>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari berita atau pengumuman..." className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="p-2 border rounded-xl font-bold text-xs bg-gray-50 outline-none" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="Semua">Semua Kategori</option>
          <option value="Berita">Berita</option>
          <option value="Pengumuman">Pengumuman</option>
          <option value="Agenda">Agenda</option>
        </select>
      </div>

      {/* FEED BERITA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full p-20 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" /> Menghubungkan ke pusat informasi...</div>
        ) : filteredNews.length === 0 ? (
          <div className="col-span-full p-20 text-center text-gray-400 border-2 border-dashed rounded-3xl italic">Belum ada berita yang diterbitkan.</div>
        ) : (
          filteredNews.map((n) => (
            <div key={n.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              <div className="p-6 space-y-4 flex-1">
                <div className="flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    n.category === 'Pengumuman' ? 'bg-orange-100 text-orange-700' : 
                    n.category === 'Agenda' ? 'bg-blue-100 text-blue-700' : 
                    'bg-teal-100 text-teal-700'
                  }`}>
                    {n.category}
                  </span>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                    <Calendar size={12}/> {n.date}
                  </div>
                </div>
                
                <h3 className="font-black text-xl text-gray-800 leading-tight uppercase group-hover:text-red-800 transition-colors">
                  {n.title}
                </h3>
                
                <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                  {n.content}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 px-6 border-t flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 italic">Oleh: {n.author}</span>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => { setFormData({...n}); setEditId(n.id); setIsEditing(true); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(n.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL EDITOR BERITA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="font-black text-2xl mb-6 text-gray-800 uppercase italic border-b pb-4">
              {isEditing ? 'Edit Berita' : 'Tulis Berita Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">Tanggal Terbit</label>
                  <input type="date" required className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">Kategori</label>
                  <select className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                    <option value="Berita">BERITA TERKINI</option>
                    <option value="Pengumuman">PENGUMUMAN RESMI</option>
                    <option value="Agenda">AGENDA KEGIATAN</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase">Judul Berita</label>
                <input required className="w-full p-3 bg-gray-50 border rounded-xl font-black uppercase text-lg outline-none focus:ring-2 focus:ring-red-500" placeholder="Ketik judul berita..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase">Isi Berita / Keterangan</label>
                <textarea required className="w-full p-3 bg-gray-50 border rounded-xl h-48 outline-none focus:ring-2 focus:ring-red-500 leading-relaxed" placeholder="Tuliskan isi berita secara lengkap di sini..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border-2 rounded-2xl font-black text-gray-400 uppercase text-xs tracking-widest">Batal</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 bg-red-800 text-white rounded-2xl font-black shadow-xl hover:bg-red-900 uppercase text-xs tracking-widest">
                  {loading ? 'Memproses...' : 'Terbitkan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;