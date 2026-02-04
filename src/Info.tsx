import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, Plus, Trash2, Edit, Calendar, Loader2, 
  Image as ImageIcon, X, Upload, ArrowRight, XCircle
} from 'lucide-react';

interface NewsItem {
  id: number;
  date: string;
  title: string;
  content: string;
  category: 'Berita' | 'Pengumuman' | 'Agenda';
  author: string;
  image_url?: string; // Foto Utama (Thumbnail)
  gallery?: string[]; // Kumpulan Foto Dokumentasi
}

const Info = () => {
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
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    category: 'Berita' as 'Berita' | 'Pengumuman' | 'Agenda',
    author: 'Admin Ranting',
    image_url: '',
    gallery: [] as string[] // Array untuk menampung banyak foto
  });

  // --- FUNGSI LINK CLICKABLE ---
  const renderContentWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold hover:text-blue-800 break-words" onClick={(e) => e.stopPropagation()}>
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const fetchNews = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('news').select('*').order('date', { ascending: false });
    if (!error) setNews(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  // --- FUNGSI UPLOAD BANYAK GAMBAR ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      // Loop semua file yang dipilih
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `doc_${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('news-images').upload(fileName, file);
        
        if (!uploadError) {
          const { data } = supabase.storage.from('news-images').getPublicUrl(fileName);
          newImages.push(data.publicUrl);
        }
      }

      // Masukkan ke state gallery (gabung dengan yang sudah ada)
      setFormData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...newImages],
        // Jika belum ada foto utama, jadikan foto pertama sebagai utama
        image_url: prev.image_url || newImages[0] || '' 
      }));

    } catch (error: any) {
      alert('Ada foto yang gagal diupload.');
    } finally {
      setUploading(false);
    }
  };

  // --- HAPUS SATU GAMBAR DARI LIST FORM ---
  const removeImage = (indexToRemove: number) => {
    setFormData(prev => {
      const newGallery = prev.gallery.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        gallery: newGallery,
        // Update thumbnail jika foto utama dihapus
        image_url: newGallery.length > 0 ? newGallery[0] : ''
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Pastikan image_url terisi jika gallery ada
    const payload = {
        ...formData,
        image_url: formData.gallery.length > 0 ? formData.gallery[0] : formData.image_url
    };

    if (isEditing && editId) {
      const { error } = await supabase.from('news').update(payload).eq('id', editId);
      if (!error) { alert('Berita diperbarui!'); setShowModal(false); fetchNews(); }
    } else {
      const { error } = await supabase.from('news').insert([payload]);
      if (!error) { alert('Berita diterbitkan!'); setShowModal(false); fetchNews(); }
    }
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Yakin hapus berita ini?')) {
      await supabase.from('news').delete().eq('id', id);
      fetchNews();
    }
  };

  const handleEditClick = (e: React.MouseEvent, n: NewsItem) => {
    e.stopPropagation();
    setFormData({
        date: n.date,
        title: n.title,
        content: n.content,
        category: n.category,
        author: n.author,
        image_url: n.image_url || '',
        gallery: n.gallery || (n.image_url ? [n.image_url] : []) // Backward compatibility
    });
    setEditId(n.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const filteredNews = news.filter(n => 
    (n.title.toLowerCase().includes(searchTerm.toLowerCase())) && 
    (filterCategory === 'Semua' || n.category === filterCategory)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase italic">Info & Berita Ranting</h1>
          <p className="text-xs text-red-700 font-bold">Portal Informasi PGRI Kalijaga</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setIsEditing(false); setFormData({date: new Date().toISOString().split('T')[0], title: '', content: '', category: 'Berita', author: 'Admin Ranting', image_url: '', gallery: []}); setShowModal(true); }} 
            className="bg-red-800 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-red-900 transition-all text-xs md:text-sm"
          >
            <Plus size={16} /> Terbitkan Berita
          </button>
        )}
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari berita..." className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="p-2 border rounded-xl font-bold text-xs bg-gray-50 outline-none" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="Semua">Semua Kategori</option>
          <option value="Berita">Berita</option><option value="Pengumuman">Pengumuman</option><option value="Agenda">Agenda</option>
        </select>
      </div>

      {/* LIST BERITA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-20 text-center"><Loader2 className="animate-spin mx-auto text-red-800" /></div>
        ) : (
          filteredNews.map((n) => (
            <div 
              key={n.id} 
              onClick={() => setSelectedNews(n)} 
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-red-200 transition-all group flex flex-col h-full cursor-pointer"
            >
              <div className="h-48 bg-gray-200 overflow-hidden relative">
                {n.image_url ? (
                  <img src={n.image_url} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon size={48} /></div>
                )}
                <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black bg-white/90 backdrop-blur shadow-sm uppercase ${n.category === 'Pengumuman' ? 'text-red-600' : 'text-gray-800'}`}>{n.category}</span>
                {/* Indikator Jumlah Foto */}
                {n.gallery && n.gallery.length > 1 && (
                    <span className="absolute bottom-4 right-4 px-2 py-1 rounded-lg text-[9px] font-bold bg-black/60 text-white flex items-center gap-1">
                        <ImageIcon size={10}/> +{n.gallery.length - 1} Foto
                    </span>
                )}
              </div>
              
              <div className="p-5 flex-1 space-y-3">
                <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><Calendar size={12}/> {new Date(n.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
                <h3 className="font-black text-lg text-gray-800 leading-tight uppercase line-clamp-2 group-hover:text-red-800 transition-colors">{n.title}</h3>
                <p className="text-gray-600 text-xs line-clamp-3 leading-relaxed">{n.content}</p>
              </div>
              
              <div className="p-4 px-5 border-t bg-gray-50 flex justify-between items-center mt-auto">
                <div className="flex items-center text-red-600 text-[10px] font-bold gap-1 group-hover:gap-2 transition-all">
                   Baca Selengkapnya <ArrowRight size={12}/>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={(e) => handleEditClick(e, n)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={14} /></button>
                    <button onClick={(e) => handleDelete(e, n.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL BACA BERITA (FULL + GALLERY) --- */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedNews(null)}>
          <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10" onClick={(e) => e.stopPropagation()}>
            <div className="bg-red-800 p-6 flex justify-between items-start text-white flex-shrink-0">
              <div className="pr-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 inline-block">{selectedNews.category}</span>
                <h2 className="text-xl md:text-2xl font-black uppercase leading-tight">{selectedNews.title}</h2>
                <div className="flex items-center gap-3 mt-3 text-red-100 text-xs font-medium">
                  <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(selectedNews.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className="opacity-50">|</span>
                  <span>Oleh: {selectedNews.author}</span>
                </div>
              </div>
              <button onClick={() => setSelectedNews(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"><X size={24} /></button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-white p-8">
              {/* Konten Teks */}
              <div className="text-sm md:text-base text-gray-800 leading-loose text-justify whitespace-pre-wrap font-serif mb-8">
                {renderContentWithLinks(selectedNews.content)}
              </div>

              {/* GALERI DOKUMENTASI (GRID) */}
              {(selectedNews.gallery && selectedNews.gallery.length > 0) ? (
                  <div className="space-y-4">
                      <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest border-b pb-2">Dokumentasi Kegiatan</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedNews.gallery.map((img, idx) => (
                              <img key={idx} src={img} className="w-full h-auto rounded-xl shadow-sm border hover:shadow-md transition-shadow" alt={`Dokumentasi ${idx+1}`}/>
                          ))}
                      </div>
                  </div>
              ) : selectedNews.image_url && (
                  // Fallback jika hanya ada 1 gambar (data lama)
                  <img src={selectedNews.image_url} className="w-full rounded-xl shadow-sm" alt="Dokumentasi"/>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end flex-shrink-0">
              <button onClick={() => setSelectedNews(null)} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold text-xs hover:bg-gray-300 transition-colors uppercase tracking-wider">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL FORM (INPUT/EDIT MULTI IMAGE) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
               <h3 className="font-black text-xl uppercase italic text-gray-800">{isEditing ? 'Edit Berita' : 'Tulis Berita Baru'}</h3>
               <button onClick={() => setShowModal(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AREA UPLOAD MULTI GAMBAR */}
              <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-3">Foto Dokumentasi (Bisa Pilih Banyak)</label>
                
                {/* Preview Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                    {formData.gallery.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square">
                            <img src={img} className="w-full h-full object-cover rounded-xl border" alt={`preview ${idx}`}/>
                            <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                <XCircle size={14}/>
                            </button>
                        </div>
                    ))}
                    
                    {/* Tombol Tambah */}
                    <label className={`cursor-pointer bg-white border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-blue-50 transition-all aspect-square text-blue-500 ${uploading ? 'opacity-50' : ''}`}>
                        {uploading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={24}/>}
                        <span className="text-[9px] font-bold uppercase">{uploading ? 'Loading' : 'Tambah'}</span>
                        <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                </div>
                <p className="text-[9px] text-gray-400 italic text-center">*Foto pertama akan menjadi thumbnail berita.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Tanggal</label>
                    <input type="date" required className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none focus:border-blue-500 transition-colors" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Kategori</label>
                    <select className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none focus:border-blue-500 transition-colors" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}><option value="Berita">BERITA</option><option value="Pengumuman">PENGUMUMAN</option><option value="Agenda">AGENDA</option></select>
                </div>
              </div>
              
              <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Judul Berita</label>
                  <input required className="w-full p-3 bg-gray-50 border rounded-xl font-black uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Judul Berita..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Isi Konten</label>
                  <textarea required className="w-full p-4 bg-gray-50 border rounded-xl h-48 outline-none focus:ring-2 focus:ring-red-500 text-sm leading-relaxed" placeholder="Tulis isi berita di sini..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
              </div>
              
              <div className="flex gap-3 pt-4 border-t mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border-2 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={loading || uploading} className="flex-1 py-4 bg-red-800 text-white rounded-2xl font-black shadow-xl hover:bg-red-900 uppercase text-[10px] tracking-widest transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={16}/> : 'Simpan Berita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Info;