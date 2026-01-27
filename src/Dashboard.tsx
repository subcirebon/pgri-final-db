import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Newspaper, Users, FileText, TrendingUp, 
  ChevronLeft, ChevronRight, Calendar, Tag 
} from 'lucide-react';

const Dashboard = () => {
  const [news, setNews] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState({ members: 0, letters: 0, newsCount: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    // 1. Ambil 5 Berita/Info Terbaru untuk Slider
    const { data: newsData } = await supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);
    
    // 2. Ambil Statistik Anggota dan Surat
    const { count: mCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
    const { count: lCount } = await supabase.from('letters').select('*', { count: 'exact', head: true });
    
    setNews(newsData || []);
    setStats({ 
      members: mCount || 0, 
      letters: lCount || 0, 
      newsCount: newsData?.length || 0 
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Timer untuk geser banner otomatis setiap 5 detik
  useEffect(() => {
    if (news.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev === news.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [news]);

  const nextSlide = () => setCurrentSlide(currentSlide === news.length - 1 ? 0 : currentSlide + 1);
  const prevSlide = () => setCurrentSlide(currentSlide === 0 ? news.length - 1 : currentSlide - 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Dashboard Administrasi</h1>
          <p className="text-xs text-red-700 font-bold uppercase tracking-widest">PGRI Ranting Kalijaga</p>
        </div>
      </div>

      {/* --- SLIDE BANNER (PENGGANTI INFO & BERITA STATIS) --- */}
      {!loading && news.length > 0 ? (
        <div className="relative h-[400px] w-full overflow-hidden rounded-[32px] shadow-2xl border-4 border-white">
          {news.map((item, index) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <img 
                src={item.image_url || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070'} 
                className="h-full w-full object-cover"
                alt={item.title}
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20 text-white">
                <span className="bg-red-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block shadow-lg">
                  {item.category}
                </span>
                <h2 className="text-3xl md:text-4xl font-black uppercase leading-tight mb-4 max-w-3xl drop-shadow-md">
                  {item.title}
                </h2>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-200 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Calendar size={12}/> {item.date}</span>
                  <span className="flex items-center gap-1">Penulis: {item.author}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Navigasi Manual */}
          <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all shadow-xl">
            <ChevronLeft size={24} />
          </button>
          <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all shadow-xl">
            <ChevronRight size={24} />
          </button>

          {/* Indikator Titik Bawah */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {news.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-10 bg-white' : 'w-2 bg-white/40'}`} />
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[400px] w-full bg-gray-100 rounded-[32px] flex items-center justify-center border-2 border-dashed text-gray-400 italic font-bold">
           Belum ada berita untuk ditampilkan di Banner.
        </div>
      )}

      {/* --- KARTU STATISTIK (DIPERTAHANKAN) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-2xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-inner">
              <Users size={24} />
            </div>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Anggota Ranting</p>
          <h4 className="text-4xl font-black text-gray-800 tracking-tighter">{stats.members}</h4>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
              <FileText size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Arsip Surat</p>
          <h4 className="text-4xl font-black text-gray-800 tracking-tighter">{stats.letters}</h4>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-teal-50 rounded-2xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-inner">
              <Newspaper size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Berita Terbit</p>
          <h4 className="text-4xl font-black text-gray-800 tracking-tighter">{stats.newsCount}</h4>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;