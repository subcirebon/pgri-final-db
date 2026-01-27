import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, Plus, Newspaper, Trash2, Edit, 
  Calendar, Loader2, Image as ImageIcon, X, Upload
} from 'lucide-react';

interface NewsItem {
  id: number;
  date: string;
  title: string;
  content: string;
  category: 'Berita' | 'Pengumuman' | 'Agenda';
  author: string;
  image_url?: string;
}

const News = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
    author: 'Admin Ranting',
    image_url: ''
  });

  const fetchNews = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('news').select('*').order('date', { ascending: false });
    if (!error) setNews(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  // FUNGSI UPLOAD GAMBAR KE SUPABASE STORAGE
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(filePath, file);

    if (uploadError) {
      alert('Gagal upload gambar: ' + uploadError.message);
    } else {
      const { data } = supabase.storage.from('news-images').getPublicUrl(filePath);
      setFormData({ ...formData, image_url: data.publicUrl });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = isEditing ? await supabase.from('news').update(formData).eq('id', editId) : await supabase.from('news').insert([formData]);
    if (!res.error) {
      alert('Berita Berhasil Diterbitkan!');
      fetchNews();
      setShowModal(false);
    }
    setLoading(false);
  };

  const filteredNews = news.filter(n => 
    (n.title.toLowerCase().includes(searchTerm.toLowerCase())) && 
    (filterCategory === 'Semua' || n.category === filterCategory)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase italic">Info & Berita Ranting</h1>
          <p className="text-xs text-red-700 font-bold">Portal Informasi PGRI Kalijaga</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setIsEditing(false); setFormData({date: new Date().toISOString().split('T')[0], title: '', content: '', category: 'Berita', author: 'Admin Ranting', image_url: ''}); setShowModal(true); }} className="bg-red-800 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-red-900 transition-all">
            <Plus size={16} /> Terbitkan Berita
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari berita..." className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="p-2 border rounded-xl font-bold text-xs bg-gray-50" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="Semua">Semua Kategori</option>
          <option value="Berita">Berita</option><option value="Pengumuman">Pengumuman</option><option value="Agenda">Agenda</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-20 text-center"><Loader2 className="animate-spin mx-auto text-red-800" /></div>
        ) : (
          filteredNews.map((n) => (
            <div key={n.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col">
              {/* GAMBAR BERITA */}
              <div className="h-48 bg-gray-200 overflow-hidden relative">
                {n.image_url ? (
                  <img src={n.image_url} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon size={48} /></div>
                )}
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black bg-white/90 backdrop-blur shadow-sm uppercase">{n.category}</span>
              </div>
              
              <div className="p-5 flex-1 space-y-3">
                <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><Calendar size={12}/> {n.date}</div>
                <h3 className="font-black text-lg text-gray-800 leading-tight uppercase line-clamp-2">{n.title}</h3>
                <p className="text-gray-600 text-xs line-clamp-3 leading-relaxed">{n.content}</p>
              </div>
              
              <div className="p-4 px-5 border-t bg-gray-50 flex justify-between items-center">
                <span className="text-[9px] font-bold text-gray-400 italic">Oleh: {n.author}</span>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => { setFormData({...n}); setEditId(n.id); setIsEditing(true); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit size={14} /></button>
                    <button onClick={async () => { if(window.confirm('Hapus berita?')) { await supabase.from('news').delete().eq('id', n.id); fetchNews(); } }} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="font-black text-xl mb-6 uppercase italic border-b pb-4 text-gray-800">Editor Berita</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* INPUT GAMBAR */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Foto Berita</label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-24 bg-gray-100 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden">
                    {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" />}
                  </div>
                  <label className="cursor-pointer bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-blue-100 transition-all">
                    {uploading ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>}
                    {formData.image_url ? 'Ganti Foto' : 'Pilih Foto'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                  {formData.image_url && <button type="button" onClick={() => setFormData({...formData, image_url: ''})} className="text-red-600 p-2 hover:bg-red-50 rounded-lg"><X size={18}/></button>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="date" required className="p-3 bg-gray-50 border rounded-xl font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                <select className="p-3 bg-gray-50 border rounded-xl font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                  <option value="Berita">BERITA</option><option value="Pengumuman">PENGUMUMAN</option><option value="Agenda">AGENDA</option>
                </select>
              </div>
              <input required className="w-full p-3 bg-gray-50 border rounded-xl font-black uppercase outline-none focus:ring-2 focus:ring-red-500" placeholder="Judul Berita..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <textarea required className="w-full p-3 bg-gray-50 border rounded-xl h-40 outline-none focus:ring-2 focus:ring-red-500 text-sm leading-relaxed" placeholder="Isi berita..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border-2 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest">Batal</button>
                <button type="submit" disabled={loading || uploading} className="flex-1 py-4 bg-red-800 text-white rounded-2xl font-black shadow-xl hover:bg-red-900 uppercase text-[10px] tracking-widest transition-all">
                  {loading ? 'Menyimpan...' : 'Terbitkan Sekarang'}
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