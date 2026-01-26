import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Download, Trash2, Filter, 
  FileSpreadsheet, Printer, ChevronDown, X, ArrowRightLeft, Lock, 
  Upload, Eye, FileText 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Transaction {
  id: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  proof?: string; 
}

const Finance = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  
  // HAK AKSES
  const canAdd = userRole === 'super_admin' || userRole === 'admin';
  const canDelete = userRole === 'super_admin';
  const canDownload = userRole === 'super_admin' || userRole === 'admin';

  // STATE DATA
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 1. LOAD DATA DARI LOCALSTORAGE
  useEffect(() => {
    const stored = localStorage.getItem('pgri_finance');
    if (stored) {
      setTransactions(JSON.parse(stored));
    } else {
      // Data Awal Dummy jika belum ada
      const initialData: Transaction[] = [
        { id: 1, date: '2026-01-10', type: 'income', category: 'Iuran Wajib', amount: 1500000, description: 'Iuran Anggota Bulan Januari', proof: '' },
        { id: 2, date: '2026-01-12', type: 'expense', category: 'ATK & Operasional', amount: 250000, description: 'Beli Kertas F4 & Tinta Printer', proof: '' },
      ];
      setTransactions(initialData);
      localStorage.setItem('pgri_finance', JSON.stringify(initialData));
    }
  }, []);

  // FUNGSI SIMPAN KE STORAGE
  const saveToStorage = (newData: Transaction[]) => {
    setTransactions(newData);
    localStorage.setItem('pgri_finance', JSON.stringify(newData));
  };

  // STATE UI
  const [showModal, setShowModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [previewProof, setPreviewProof] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  
  // STATE FORM
  const [formData, setFormData] = useState<{
    date: string, type: string, category: string, amount: string, description: string, proof: string
  }>({ 
    date: new Date().toISOString().split('T')[0], type: 'income', category: 'Iuran Wajib', amount: '', description: '', proof: '' 
  });

  // 2. HANDLERS
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = { 
      id: Date.now(), 
      date: formData.date, 
      type: formData.type as 'income' | 'expense', 
      category: formData.category, 
      amount: Number(formData.amount), 
      description: formData.description,
      proof: formData.proof 
    };
    
    // Simpan Data Baru (Gabung dengan data lama)
    const updatedTransactions = [newTx, ...transactions];
    saveToStorage(updatedTransactions);
    
    setShowModal(false);
    setFormData({ date: new Date().toISOString().split('T')[0], type: 'income', category: 'Iuran Wajib', amount: '', description: '', proof: '' });
    alert('Transaksi berhasil dicatat!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, proof: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Hapus transaksi ini? Saldo akan berubah.')) {
      const updatedTransactions = transactions.filter(t => t.id !== id);
      saveToStorage(updatedTransactions);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Keuangan");
    XLSX.writeFile(wb, `Laporan_Keuangan_PGRI.xlsx`);
  };

  // 3. PERHITUNGAN SALDO
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const currentBalance = totalIncome - totalExpense;
  
  const filteredTransactions = transactions.filter(t => filterType === 'all' || t.type === filterType);
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-6 relative print:p-0 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div><h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Laporan Keuangan</h1><p className="text-gray-500 text-sm italic">Transparansi Pengelolaan Kas Organisasi</p></div>
        <div className="flex gap-3 relative">
          {canDownload && (
            <div className="relative">
               <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-white text-green-700 border border-green-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-50 shadow-sm text-sm font-bold"><Download size={18} /> <span className="hidden sm:inline">Download</span> <ChevronDown size={14} /></button>
               {showExportMenu && (<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 overflow-hidden"><button onClick={exportToExcel} className="w-full text-left px-4 py-3 hover:bg-green-50 text-gray-700 text-sm font-bold"><FileSpreadsheet size={16} className="inline mr-2"/> Excel (.xlsx)</button><button onClick={()=>window.print()} className="w-full text-left px-4 py-3 hover:bg-red-50 text-gray-700 border-t text-sm font-bold"><Printer size={16} className="inline mr-2"/> Cetak PDF</button></div>)}
            </div>
          )}
          {canAdd && <button onClick={() => setShowModal(true)} className="bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-800 shadow-md text-sm font-bold"><Plus size={18} /> <span>Catat Transaksi</span></button>}
        </div>
      </div>

      {/* SALDO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64} /></div><p className="text-indigo-100 text-xs font-bold uppercase mb-1 tracking-wider">Saldo Kas Saat Ini</p><h2 className="text-3xl font-bold">{formatRp(currentBalance)}</h2></div>
        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between"><div><p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Pemasukan</p><h3 className="text-2xl font-bold text-green-600">{formatRp(totalIncome)}</h3></div><div className="bg-green-50 p-3 rounded-full text-green-600"><TrendingUp size={24} /></div></div>
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between"><div><p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Pengeluaran</p><h3 className="text-2xl font-bold text-red-600">{formatRp(totalExpense)}</h3></div><div className="bg-red-50 p-3 rounded-full text-red-600"><TrendingDown size={24} /></div></div>
      </div>

      {/* TABEL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 print:hidden">
          <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase"><ArrowRightLeft size={18} /> Riwayat Transaksi</h3>
          <div className="flex items-center gap-2"><Filter size={16} className="text-gray-400" /><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-white border border-gray-300 text-gray-600 text-xs font-bold rounded-lg p-2 outline-none"><option value="all">Semua</option><option value="income">Pemasukan (+)</option><option value="expense">Pengeluaran (-)</option></select></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs uppercase font-bold text-gray-500">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Bukti</th>
                <th className="p-4 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic">Belum ada data transaksi.</td></tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600 whitespace-nowrap font-mono text-xs">{t.date}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${t.type === 'income' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{t.category}</span></td>
                    <td className="p-4 text-gray-800 font-medium">{t.description}</td>
                    <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+ ' : '- '} {formatRp(t.amount)}</td>
                    <td className="p-4 text-center">
                      {t.proof ? (
                        <button onClick={() => setPreviewProof(t.proof || null)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" title="Lihat Bukti"><Eye size={18} /></button>
                      ) : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <td className="p-4 text-center print:hidden">
                      {canDelete ? (
                        <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-red-50" title="Hapus"><Trash2 size={16} /></button>
                      ) : <span className="text-gray-300"><Lock size={14} /></span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CATAT TRANSAKSI */}
      {canAdd && showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg uppercase text-gray-800">Catat Transaksi</h3><button onClick={() => setShowModal(false)}><X size={20}/></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button type="button" onClick={() => setFormData({...formData, type: 'income', category: 'Iuran Wajib'})} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${formData.type === 'income' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Pemasukan</button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'expense', category: 'ATK & Operasional'})} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${formData.type === 'expense' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Pengeluaran</button>
                </div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tanggal</label><input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Kategori</label><select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{formData.type === 'income' ? ['Iuran Wajib', 'Sumbangan', 'Dana Sosial', 'Lainnya'].map(o=><option key={o}>{o}</option>) : ['ATK & Operasional', 'Konsumsi', 'Transport', 'Dana Sosial', 'Lainnya'].map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nominal (Rp)</label><input type="number" placeholder="0" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Keterangan</label><input type="text" placeholder="Contoh: Beli Kertas F4..." className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Upload Bukti (Opsional)</label>
                  <div className="border border-dashed border-gray-300 p-3 rounded-lg bg-gray-50 text-center relative hover:bg-gray-100 transition-colors">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                      {formData.proof ? <span className="text-green-600 font-bold flex items-center gap-1"><FileText size={14}/> File Terpilih</span> : <><Upload size={16}/> Klik untuk upload foto/nota</>}
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-3 rounded-lg font-bold shadow-lg mt-2 uppercase tracking-wide transition-colors">Simpan Transaksi</button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL PREVIEW BUKTI */}
      {previewProof && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewProof(null)}>
          <div className="relative max-w-lg w-full">
            <button onClick={() => setPreviewProof(null)} className="absolute -top-10 right-0 text-white hover:text-red-400 bg-white/10 p-2 rounded-full"><X size={24}/></button>
            <img src={previewProof} alt="Bukti Transaksi" className="w-full rounded-lg shadow-2xl border-4 border-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;