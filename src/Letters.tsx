import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Search, Plus, Printer, Edit, Trash2, Loader2 } from 'lucide-react';

const Letters = () => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fungsi untuk mengambil data dari Supabase
  const fetchLetters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Kesalahan pengambilan data:', error);
    } else {
      setLetters(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  const filteredLetters = letters.filter(l => 
    (l.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (l.ref_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Sistem Surat Masuk & Keluar</h2>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm">
            <Plus size={16} /> Buat Undangan
          </button>
          <button className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm">
            <Plus size={16} /> Buat Pengumuman
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari Nomor atau Perihal..." 
          className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b">
            <tr>
              <th className="p-4">Tanggal</th>
              <th className="p-4">No. Surat</th>
              <th className="p-4">Tujuan</th>
              <th className="p-4">Perihal</th>
              <th className="p-4">Tipe</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
            ) : filteredLetters.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400 italic">
                  Database masih kosong. Gunakan fitur "Buat" untuk menambah surat ke Supabase.
                </td>
              </tr>
            ) : (
              filteredLetters.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 whitespace-nowrap">{l.date}</td>
                  <td className="p-4 font-bold">{l.ref_number}</td>
                  <td className="p-4">{l.sender_receiver}</td>
                  <td className="p-4">{l.subject}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${l.type === 'UNDANGAN' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                      {l.type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded" title="Cetak"><Printer size={16}/></button>
                      <button className="p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded" title="Edit"><Edit size={16}/></button>
                      <button className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded" title="Hapus"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Letters;